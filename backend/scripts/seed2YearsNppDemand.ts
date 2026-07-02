/**
 * seed2YearsNppDemand.ts
 *
 * Fetches historical All-India demand + generation data from npp.gov.in
 * and seeds it into NppRawDemandData and NppRawGenerationData tables.
 *
 * NOTE: The NPP API only retains ~9 months of history. Data is available
 * from approx. Sep 20, 2025 onwards. Earlier dates return empty arrays.
 * The script gracefully handles empty responses and skips those dates.
 *
 * APIs used (no auth required):
 *   - https://npp.gov.in/dashBoard/demandmet1chartdata?date=YYYY-MM-DD  → demand
 *   - https://npp.gov.in/dashBoard/demandmet2chartdata?date=YYYY-MM-DD  → generation
 *
 * Usage:
 *   npx ts-node scripts/seed2YearsNppDemand.ts
 *
 * Features:
 *   - Skips dates already fully seeded (checks existing row count per date)
 *   - Rate-limited: 1 req/sec per endpoint with exponential backoff on errors
 *   - Inserts in batches using createMany + skipDuplicates
 *   - Graceful shutdown on SIGINT
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────
const START_DATE = '2025-09-20';
const END_DATE   = '2026-07-01';
const DELAY_MS   = 1200;   // ms between date iterations (per endpoint)
const MAX_RETRIES = 4;
const BATCH_SIZE  = 500;

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function getAllDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

function toISTTimeStr(epochMs: number): string {
  const d = new Date(epochMs);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

const axiosClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; IEXDashboard/1.0)',
    Accept: 'application/json, text/plain, */*',
  },
});

async function fetchWithRetry<T>(url: string, retries = MAX_RETRIES): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axiosClient.get<T>(url);
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const wait = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      if (attempt === retries) {
        console.warn(`  [WARN] Failed after ${retries} attempts: ${url} (${status ?? err.message})`);
        return null;
      }
      console.warn(`  [RETRY ${attempt}/${retries}] ${url} — waiting ${Math.round(wait)}ms`);
      await sleep(wait);
    }
  }
  return null;
}

// ─────────────────────────────────────────
// Demand Seeder
// ─────────────────────────────────────────
async function seedDemandForDate(dateStr: string): Promise<number> {
  const url = `https://npp.gov.in/dashBoard/demandmet1chartdata?date=${dateStr}`;
  const raw = await fetchWithRetry<any[]>(url);

  if (!raw || !Array.isArray(raw) || raw.length === 0) return 0;

    const records = raw
    .filter((item: any) => item?.value_of_data != null && item?.updated_on != null)
    .map((item: any) => {
      const epochMs = Number(item.updated_on);
      const dateObj = new Date(epochMs);
      const istDateStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(dateObj).split('/').reverse().join('-'); // DD/MM/YYYY → YYYY-MM-DD
      return {
        date: dateStr,
        timeStr: `${dateStr} ${toISTTimeStr(epochMs)}`,
        demandMet: Number(item.value_of_data),
        dataUpdatedAt: dateObj.toISOString(),
        fetchedAt: new Date(),
      };
    });

  if (records.length === 0) return 0;

  // Use raw SQL to bypass stale Prisma generated client types
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    for (const r of batch) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO public."NppRawDemandData" (id, date, "timeStr", "demandMet", "dataUpdatedAt", "fetchedAt", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (date, "timeStr") DO NOTHING`,
          r.date, r.timeStr, r.demandMet, r.dataUpdatedAt, r.fetchedAt
        );
        inserted++;
      } catch (e: any) {
        console.error(`  [SQL ERROR] ${r.date} ${r.timeStr}: ${e.message}`);
      }
    }
  }
  return inserted;
}

// ─────────────────────────────────────────
// Generation Seeder
// ─────────────────────────────────────────
async function seedGenerationForDate(dateStr: string): Promise<number> {
  const url = `https://npp.gov.in/dashBoard/demandmet2chartdata?date=${dateStr}`;
  const raw = await fetchWithRetry<any[]>(url);

  if (!raw || !Array.isArray(raw) || raw.length === 0) return 0;

  // Group all source values by timestamp
  const byTime: Record<string, {
    thermal: number; gas: number; nuclear: number;
    hydro: number; wind: number; solar: number;
    epochMs: number;
  }> = {};

  for (const item of raw) {
    if (!item?.updated_on || item?.value_of_data == null) continue;
    const epochMs = Number(item.updated_on);
    const timeStr = toISTTimeStr(epochMs);

    if (!byTime[timeStr]) {
      byTime[timeStr] = { thermal: 0, gas: 0, nuclear: 0, hydro: 0, wind: 0, solar: 0, epochMs };
    }

    const name = String(item.name_of_data ?? '').toUpperCase();
    const value = Number(item.value_of_data) || 0;

    if (name.includes('THERMAL')) byTime[timeStr].thermal = value;
    else if (name.includes('GAS'))     byTime[timeStr].gas = value;
    else if (name.includes('NUCLEAR')) byTime[timeStr].nuclear = value;
    else if (name.includes('HYDRO'))   byTime[timeStr].hydro = value;
    else if (name.includes('WIND'))    byTime[timeStr].wind = value;
    else if (name.includes('SOLAR'))   byTime[timeStr].solar = value;
  }

  const records = Object.entries(byTime).map(([timeStr, g]) => ({
    date: dateStr,
    timeStr: `${dateStr} ${timeStr}`,
    thermal: g.thermal,
    gas: g.gas,
    nuclear: g.nuclear,
    hydro: g.hydro,
    wind: g.wind,
    solar: g.solar,
    dataUpdatedAt: new Date(g.epochMs).toISOString(),
    fetchedAt: new Date(),
  }));

  if (records.length === 0) return 0;

  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    for (const r of batch) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO public."NppRawGenerationData" (id, date, "timeStr", thermal, gas, nuclear, hydro, wind, solar, "dataUpdatedAt", "fetchedAt", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           ON CONFLICT (date, "timeStr") DO NOTHING`,
          r.date, r.timeStr, r.thermal, r.gas, r.nuclear, r.hydro, r.wind, r.solar, r.dataUpdatedAt, r.fetchedAt
        );
        inserted++;
      } catch (e: any) {
        console.error(`  [SQL ERROR] ${r.date} ${r.timeStr}: ${e.message}`);
      }
    }
  }
  return inserted;
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────
let aborted = false;
process.on('SIGINT', () => {
  console.log('\n[SIGINT] Gracefully stopping after current date...');
  aborted = true;
});

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` NPP 2-Year Historical Data Seeder`);
  console.log(` Range: ${START_DATE} → ${END_DATE}`);
  console.log(`${'='.repeat(60)}\n`);

  const allDates = getAllDates(START_DATE, END_DATE);
  console.log(`Total dates to process: ${allDates.length}\n`);

  // Auto-create NppRawDemandData table if not exists using raw SQL
  console.log('[INIT] Ensuring public."NppRawDemandData" table exists...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."NppRawDemandData" (
        id TEXT NOT NULL,
        date TEXT NOT NULL,
        "timeStr" TEXT NOT NULL,
        "demandMet" DOUBLE PRECISION NOT NULL,
        "dataUpdatedAt" TEXT,
        "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NppRawDemandData_pkey" PRIMARY KEY (id)
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_npp_date_time ON public."NppRawDemandData"(date, "timeStr");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NppRawDemandData_date_idx" ON public."NppRawDemandData"(date);
    `);
    console.log('[INIT] Table public."NppRawDemandData" is ready.');
  } catch (e: any) {
    console.error('[INIT] Error creating NppRawDemandData table:', e.message);
  }

  // Auto-create NppRawGenerationData table if not exists using raw SQL
  console.log('[INIT] Ensuring public."NppRawGenerationData" table exists...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."NppRawGenerationData" (
        id TEXT NOT NULL,
        date TEXT NOT NULL,
        "timeStr" TEXT NOT NULL,
        thermal DOUBLE PRECISION,
        gas DOUBLE PRECISION,
        nuclear DOUBLE PRECISION,
        hydro DOUBLE PRECISION,
        wind DOUBLE PRECISION,
        solar DOUBLE PRECISION,
        "dataUpdatedAt" TEXT,
        "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NppRawGenerationData_pkey" PRIMARY KEY (id)
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_npp_gen_date_time ON public."NppRawGenerationData"(date, "timeStr");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NppRawGenerationData_date_idx" ON public."NppRawGenerationData"(date);
    `);
    console.log('[INIT] Table public."NppRawGenerationData" is ready.');
  } catch (e: any) {
    console.error('[INIT] Error creating NppRawGenerationData table:', e.message);
  }

  // Pre-check which dates already have demand data (skip if ≥ 5 rows exist)
  console.log('[PRE-CHECK] Loading already-seeded demand dates...');
  const existingDemandRaw = await prisma.$queryRawUnsafe<{date: string}[]>(
    `SELECT DISTINCT date FROM public."NppRawDemandData" GROUP BY date HAVING COUNT(*) >= 5`
  );
  const seededDemandDates = new Set(existingDemandRaw.map((r: any) => r.date));

  console.log('[PRE-CHECK] Loading already-seeded generation dates...');
  let seededGenDates = new Set<string>();
  try {
    const existingGenRaw = await prisma.$queryRawUnsafe<{date: string}[]>(
      `SELECT DISTINCT date FROM public."NppRawGenerationData" GROUP BY date HAVING COUNT(*) >= 5`
    );
    seededGenDates = new Set(existingGenRaw.map((r: any) => r.date));
  } catch (e: any) {
    console.log('[PRE-CHECK] nppRawGenerationData query failed, skipping generation seeding:', e.message);
  }

  console.log(`[PRE-CHECK] Already have demand for ${seededDemandDates.size} dates, generation for ${seededGenDates.size} dates.\n`);

  let totalDemandInserted = 0;
  let totalGenInserted    = 0;
  let skippedDates        = 0;
  let failedDates         = 0;

  for (let i = 0; i < allDates.length; i++) {
    if (aborted) break;

    const dateStr = allDates[i];
    const demandDone = seededDemandDates.has(dateStr);
    const genDone    = seededGenDates.has(dateStr);

    if (demandDone && genDone) {
      skippedDates++;
      if (skippedDates % 30 === 0) {
        console.log(`[SKIP] ${skippedDates} dates already seeded, continuing...`);
      }
      continue;
    }

    process.stdout.write(`[${i + 1}/${allDates.length}] ${dateStr} → `);

    try {
      let demandCount = 0;
      let genCount    = 0;

      if (!demandDone) {
        demandCount = await seedDemandForDate(dateStr);
        totalDemandInserted += demandCount;
        await sleep(DELAY_MS);
      }

      if (!aborted && !genDone) {
        try {
          genCount = await seedGenerationForDate(dateStr);
          totalGenInserted += genCount;
          await sleep(DELAY_MS);
        } catch {
          // generation table not available, skip silently
        }
      }

      console.log(`demand +${demandCount}  gen +${genCount}`);
    } catch (err: any) {
      console.error(`\n  [ERROR] ${dateStr}: ${err.message}`);
      failedDates++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(` Seeding Complete!`);
  console.log(`  Demand rows inserted : ${totalDemandInserted.toLocaleString()}`);
  console.log(`  Gen rows inserted    : ${totalGenInserted.toLocaleString()}`);
  console.log(`  Dates skipped        : ${skippedDates}`);
  console.log(`  Dates failed         : ${failedDates}`);
  console.log(`${'='.repeat(60)}\n`);
}

main()
  .catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
