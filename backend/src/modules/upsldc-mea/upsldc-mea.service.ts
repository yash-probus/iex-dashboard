import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { OA_GENERATORS } from './oa-generators.data';
import seededMeaData from './seeded-mea-data.json';

export interface UpsldcRecord {
  slNo: number;
  month: string;
  year: number;
  version: string;
  despatchedDate: string;
  pdfUrl: string;
}

export interface UpsldcGenerator {
  genId: string;
  name: string;
  category: string;
  records: UpsldcRecord[];
  totalRecords: number;
  lastTradedMonth: string | null;
  lastTradedYear: number | null;
  lastTradedDate: string | null;
  status: 'TRADING' | 'NOT_TRADING_RECENT' | 'NEVER_TRADED';
  latestPdfUrl: string | null;
  lastUpdated: string;
}

export interface UpsldcScrapeStatus {
  isRunning: boolean;
  total: number;
  completed: number;
  activeCount: number;
  inactiveCount: number;
  neverTradedCount: number;
  startTime: string | null;
  endTime: string | null;
  lastError: string | null;
  triggeredBy: 'CRON' | 'MANUAL';
  percent: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'upsldc_mea_data.json');

const MONTH_MAP: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
};

const BASE_UPSLDC_URL = 'https://nrt.upsldc.org';
const REPORT_URL = `${BASE_UPSLDC_URL}/eass/portal/mis/GeneratorMEAReport.jsp`;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export class UpsldcMeaService {
  private static memoryMap: Record<string, UpsldcGenerator> | null = null;

  private static scrapeStatus: UpsldcScrapeStatus = {
    isRunning: false,
    total: OA_GENERATORS.length,
    completed: OA_GENERATORS.length,
    activeCount: 610,
    inactiveCount: 3,
    neverTradedCount: 2,
    startTime: null,
    endTime: null,
    lastError: null,
    triggeredBy: 'MANUAL',
    percent: 100
  };

  /**
   * Ensure data directory and initial data exists in memory and file
   */
  private static ensureDataFile(): void {
    if (this.memoryMap && Object.keys(this.memoryMap).length > 0) {
      return;
    }

    // Try reading from file first
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && Object.keys(parsed).length > 0) {
          this.memoryMap = parsed;
          if (this.memoryMap) this.recalculateStatuses(this.memoryMap);
          return;
        }
      }
    } catch (e) {
      console.warn('[UpsldcMeaService] Could not read existing data file:', e);
    }

    // Initialize from pre-scraped seeded data
    if (seededMeaData && Object.keys(seededMeaData).length > 0) {
      this.memoryMap = JSON.parse(JSON.stringify(seededMeaData));
      if (this.memoryMap) this.recalculateStatuses(this.memoryMap);
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryMap, null, 2), 'utf-8');
        console.log(`[UpsldcMeaService] Successfully seeded data file with ${Object.keys(this.memoryMap || {}).length} generators.`);
      } catch (e) {
        console.warn('[UpsldcMeaService] Failed to write seeded data file to disk (in-memory only):', e);
      }
      return;
    }

    // Fallback: Initialize empty OA_GENERATORS
    const defaultData: Record<string, UpsldcGenerator> = {};
    for (const g of OA_GENERATORS) {
      defaultData[g.genId] = {
        genId: g.genId,
        name: g.name,
        category: 'OA',
        records: [],
        totalRecords: 0,
        lastTradedMonth: null,
        lastTradedYear: null,
        lastTradedDate: null,
        status: 'NEVER_TRADED',
        latestPdfUrl: null,
        lastUpdated: new Date().toISOString()
      };
    }

    this.memoryMap = defaultData;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      console.log(`[UpsldcMeaService] Initialized data file with ${OA_GENERATORS.length} generators.`);
    } catch (e) {
      console.warn('[UpsldcMeaService] Failed to write initial data file to disk (using memory only):', e);
    }
  }

  /**
   * Load current generators from memory or JSON storage
   */
  public static getGeneratorsMap(): Record<string, UpsldcGenerator> {
    this.ensureDataFile();
    return this.memoryMap || {};
  }

  /**
   * Save generators map to memory and JSON storage
   */
  private static saveGeneratorsMap(map: Record<string, UpsldcGenerator>): void {
    this.memoryMap = map;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(map, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[UpsldcMeaService] Failed to save generators file to disk:', e);
    }
  }

  /**
   * Get all generators with filtering, search, pagination, and sorting
   */
  public static getGenerators(options: {
    search?: string;
    status?: 'ALL' | 'TRADING' | 'NOT_TRADING_RECENT' | 'NEVER_TRADED' | 'NOT_TRADED_LAST_MONTH' | 'NOT_TRADED_3_MONTHS';
    year?: string;
    month?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const map = this.getGeneratorsMap();
    let list = Object.values(map);

    // Find max system score (current published month)
    let maxOverallScore = 0;
    for (const g of Object.values(map)) {
      if (g.lastTradedYear && g.lastTradedMonth) {
        const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
        if (score > maxOverallScore) maxOverallScore = score;
      }
    }

    // Apply Search
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.genId.toLowerCase().includes(q)
      );
    }

    // Apply Status Filter
    if (options.status && options.status !== 'ALL') {
      if (options.status === 'NOT_TRADED_3_MONTHS') {
        // Has not traded in recent 3 months from current month (or never traded)
        list = list.filter(g => {
          if (!g.records || g.records.length === 0 || !g.lastTradedYear || !g.lastTradedMonth) return true;
          const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
          return (maxOverallScore - score) >= 3;
        });
      } else if (options.status === 'NOT_TRADED_LAST_MONTH') {
        list = list.filter(g => {
          if (!g.records || g.records.length === 0 || !g.lastTradedYear || !g.lastTradedMonth) return true;
          const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
          return (maxOverallScore - score) >= 1;
        });
      } else if (options.status === 'TRADING') {
        list = list.filter(g => {
          if (!g.records || g.records.length === 0 || !g.lastTradedYear || !g.lastTradedMonth) return false;
          const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
          return (maxOverallScore - score) < 3;
        });
      } else {
        list = list.filter(g => g.status === options.status);
      }
    }

    // Apply Year Filter (only if status is not specifically NEVER_TRADED)
    if (options.status !== 'NEVER_TRADED' && options.status !== 'NOT_TRADED_LAST_MONTH' && options.year && options.year !== 'ALL') {
      const yr = parseInt(options.year, 10);
      list = list.filter(g => g.lastTradedYear === yr);
    }

    // Apply Month Filter (only if status is not specifically NEVER_TRADED)
    if (options.status !== 'NEVER_TRADED' && options.status !== 'NOT_TRADED_LAST_MONTH' && options.month && options.month !== 'ALL') {
      const m = options.month.trim().toUpperCase();
      list = list.filter(g => g.lastTradedMonth === m);
    }

    // Sorting
    const sortField = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'genId') {
        comparison = parseInt(a.genId || '0', 10) - parseInt(b.genId || '0', 10);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'lastTraded') {
        const valA = (a.lastTradedYear || 0) * 100 + (a.lastTradedMonth ? MONTH_MAP[a.lastTradedMonth] || 0 : 0);
        const valB = (b.lastTradedYear || 0) * 100 + (b.lastTradedMonth ? MONTH_MAP[b.lastTradedMonth] || 0 : 0);
        comparison = valA - valB;
      } else if (sortField === 'totalRecords') {
        comparison = (a.totalRecords || 0) - (b.totalRecords || 0);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = list.length;
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated
    };
  }

  /**
   * Get single generator with full records
   */
  public static getGeneratorById(genId: string): UpsldcGenerator | null {
    const map = this.getGeneratorsMap();
    return map[genId] || null;
  }

  /**
   * Summary metrics for dashboard KPI cards
   */
  public static getSummary() {
    const map = this.getGeneratorsMap();
    const list = Object.values(map);

    let maxOverallScore = 0;
    for (const g of list) {
      if (g.lastTradedYear && g.lastTradedMonth) {
        const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
        if (score > maxOverallScore) maxOverallScore = score;
      }
    }

    let tradingCount = 0;
    let notTraded3MonthsCount = 0;
    let notTradedLastMonthCount = 0;
    let neverTradedCount = 0;

    let latestTradedYear: number | null = null;
    let latestTradedMonth: string | null = null;

    for (const g of list) {
      if (!g.records || g.records.length === 0 || !g.lastTradedYear || !g.lastTradedMonth) {
        neverTradedCount++;
        notTraded3MonthsCount++;
        notTradedLastMonthCount++;
      } else {
        const diff = maxOverallScore - (g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0));
        if (diff >= 3) {
          notTraded3MonthsCount++;
        } else {
          tradingCount++;
        }

        if (diff >= 1) {
          notTradedLastMonthCount++;
        }

        const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
        if (score === maxOverallScore) {
          latestTradedYear = g.lastTradedYear;
          latestTradedMonth = g.lastTradedMonth;
        }
      }
    }

    return {
      totalGenerators: list.length,
      tradingCount,
      notTraded3MonthsCount,
      notTradedLastMonthCount,
      neverTradedCount,
      latestSystemTradedPeriod: latestTradedYear && latestTradedMonth ? `${latestTradedMonth} ${latestTradedYear}` : null,
      scrapeStatus: this.scrapeStatus
    };
  }

  /**
   * Fetch live list of Open Access generators dynamically from UPSLDC portal
   */
  public static async fetchLiveOaGeneratorsList(): Promise<Array<{ genId: string; name: string }>> {
    try {
      const response = await axios.get(`${REPORT_URL}?genCat=7`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        httpsAgent,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const liveList: Array<{ genId: string; name: string }> = [];

      $('select[name="genID"] option').each((_, el) => {
        const val = $(el).attr('value');
        const text = $(el).text().trim();
        if (val && val !== '0' && val !== '' && !val.toLowerCase().includes('select')) {
          liveList.push({ genId: val, name: text });
        }
      });

      if (liveList.length > 0) {
        console.log(`[UpsldcMeaService] Fetched ${liveList.length} live Open Access generators from UPSLDC portal.`);
        return liveList;
      }
    } catch (err: any) {
      console.warn('[UpsldcMeaService] Failed to fetch live generator list from UPSLDC portal, using fallback:', err.message);
    }

    return OA_GENERATORS;
  }

  /**
   * Sync and discover new generators from UPSLDC portal without requiring a full scrape
   */
  public static async syncNewGenerators(): Promise<{ total: number; newlyAdded: number; newGenerators: Array<{ genId: string; name: string }> }> {
    const liveList = await this.fetchLiveOaGeneratorsList();
    const map = this.getGeneratorsMap();
    const newGenerators: Array<{ genId: string; name: string }> = [];

    for (const g of liveList) {
      if (!map[g.genId]) {
        map[g.genId] = {
          genId: g.genId,
          name: g.name,
          category: 'OA',
          records: [],
          totalRecords: 0,
          lastTradedMonth: null,
          lastTradedYear: null,
          lastTradedDate: null,
          status: 'NEVER_TRADED',
          latestPdfUrl: null,
          lastUpdated: new Date().toISOString()
        };
        newGenerators.push(g);
      } else if (g.name && map[g.genId].name !== g.name) {
        map[g.genId].name = g.name;
      }
    }

    if (newGenerators.length > 0) {
      this.recalculateStatuses(map);
      this.saveGeneratorsMap(map);
      console.log(`[UpsldcMeaService] Discovered and registered ${newGenerators.length} new generator(s) from UPSLDC.`);
    }

    return {
      total: Object.keys(map).length,
      newlyAdded: newGenerators.length,
      newGenerators
    };
  }

  /**
   * Scrape MEA for a single generator across specified years
   */
  public static async scrapeGenerator(genId: string, genName: string, years: string[] = ['2025', '2026', '2024']): Promise<UpsldcRecord[]> {
    const allRecords: UpsldcRecord[] = [];

    for (const yr of years) {
      try {
        const payload = new URLSearchParams({
          genCat: '7',
          genID: genId,
          year: yr,
          display: 'display'
        }).toString();

        const response = await axios.post(REPORT_URL, payload, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${REPORT_URL}?genCat=7`
          },
          httpsAgent,
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const rows = $('table#dataTables-example tbody tr');

        rows.each((_, tr) => {
          const cells = $(tr).find('td');
          if (cells.length >= 4) {
            const slNo = parseInt($(cells[0]).text().trim(), 10) || 0;
            const month = $(cells[1]).text().trim().toUpperCase();
            const year = parseInt($(cells[2]).text().trim(), 10) || parseInt(yr, 10);
            const version = $(cells[3]).text().trim();
            
            // Check for date and PDF
            let despatchedDate = '';
            let pdfUrl = '';

            const linkElem = $(tr).find('a[href*=".pdf"]');
            if (linkElem.length > 0) {
              const href = linkElem.attr('href') || '';
              pdfUrl = href.startsWith('http') ? href : `${BASE_UPSLDC_URL}${href.startsWith('/') ? '' : '/'}${href}`;
            }

            if (cells.length >= 5) {
              const textVal = $(cells[4]).text().trim();
              if (textVal && !textVal.includes('.pdf') && textVal.length > 4) {
                despatchedDate = textVal;
              }
            }

            if (month && MONTH_MAP[month]) {
              allRecords.push({
                slNo,
                month,
                year,
                version,
                despatchedDate,
                pdfUrl
              });
            }
          }
        });
      } catch (err: any) {
        console.warn(`[UpsldcMeaService] Warning: Error fetching genId ${genId} for year ${yr}:`, err.message);
      }
    }

    // Sort records descending by (year, month, version)
    allRecords.sort((a, b) => {
      const scoreA = a.year * 100 + (MONTH_MAP[a.month] || 0);
      const scoreB = b.year * 100 + (MONTH_MAP[b.month] || 0);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return parseInt(b.version || '0', 10) - parseInt(a.version || '0', 10);
    });

    return allRecords;
  }

  /**
   * Recalculate status of all generators based on latest available system period
   */
  public static recalculateStatuses(map: Record<string, UpsldcGenerator>): void {
    let maxOverallScore = 0;

    // Find the latest active month across all generators in the database
    for (const g of Object.values(map)) {
      if (g.lastTradedYear && g.lastTradedMonth) {
        const score = g.lastTradedYear * 12 + (MONTH_MAP[g.lastTradedMonth] || 0);
        if (score > maxOverallScore) {
          maxOverallScore = score;
        }
      }
    }

    for (const g of Object.values(map)) {
      if (!g.records || g.records.length === 0) {
        g.status = 'NEVER_TRADED';
        g.lastTradedMonth = null;
        g.lastTradedYear = null;
        g.lastTradedDate = null;
        g.latestPdfUrl = null;
        g.totalRecords = 0;
      } else {
        const latest = g.records[0];
        g.lastTradedMonth = latest.month;
        g.lastTradedYear = latest.year;
        g.lastTradedDate = latest.despatchedDate || null;
        g.latestPdfUrl = latest.pdfUrl || null;
        g.totalRecords = g.records.length;

        const score = latest.year * 12 + (MONTH_MAP[latest.month] || 0);
        
        // If traded in the latest published billing month in UP, considered TRADING
        // Otherwise, marked as NOT_TRADING_RECENT (missed latest month or stopped trading)
        if (maxOverallScore > 0 && score === maxOverallScore) {
          g.status = 'TRADING';
        } else {
          g.status = 'NOT_TRADING_RECENT';
        }
      }
    }
  }

  /**
   * Run full scrape of all OA generators
   */
  public static async runScraper(triggeredBy: 'CRON' | 'MANUAL' = 'MANUAL'): Promise<void> {
    if (this.scrapeStatus.isRunning) {
      console.log('[UpsldcMeaService] Scraper is already running. Skipping.');
      return;
    }

    const map = this.getGeneratorsMap();
    const genList = Object.values(map);

    let curActive = 0, curInactive = 0, curNever = 0;
    for (const g of genList) {
      if (g.status === 'TRADING') curActive++;
      else if (g.status === 'NOT_TRADING_RECENT') curInactive++;
      else curNever++;
    }

    this.scrapeStatus = {
      isRunning: true,
      total: genList.length,
      completed: 0,
      activeCount: curActive,
      inactiveCount: curInactive,
      neverTradedCount: curNever,
      startTime: new Date().toISOString(),
      endTime: null,
      lastError: null,
      triggeredBy,
      percent: 0
    };

    console.log(`[UpsldcMeaService] Starting scrape of ${genList.length} OA generators (${triggeredBy})...`);

    // Asynchronous background execution
    (async () => {
      const BATCH_SIZE = 5;
      const yearsToScrape = ['2026', '2025'];

      try {
        // Auto-discover newly added generators on UPSLDC portal
        try {
          const syncResult = await this.syncNewGenerators();
          if (syncResult.newlyAdded > 0) {
            console.log(`[UpsldcMeaService] Scraper auto-discovered ${syncResult.newlyAdded} new generator(s) from UPSLDC portal!`);
          }
        } catch (e: any) {
          console.warn('[UpsldcMeaService] Dynamic generator sync error (continuing with cached list):', e.message);
        }

        const currentGenList = Object.values(map);
        this.scrapeStatus.total = currentGenList.length;

        for (let i = 0; i < currentGenList.length; i += BATCH_SIZE) {
          const batch = currentGenList.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (gen) => {
              const records = await this.scrapeGenerator(gen.genId, gen.name, yearsToScrape);
              if (records.length > 0) {
                map[gen.genId].records = records;
              }
              map[gen.genId].lastUpdated = new Date().toISOString();
            })
          );

          this.scrapeStatus.completed = Math.min(i + batch.length, currentGenList.length);
          this.scrapeStatus.percent = Math.round((this.scrapeStatus.completed / currentGenList.length) * 100);

          // Save partial progress every 20 generators
          if ((i + batch.length) % 20 === 0 || i + batch.length >= currentGenList.length) {
            this.recalculateStatuses(map);
            this.saveGeneratorsMap(map);
          }

          // Small delay between batches to be gentle on server
          await new Promise(res => setTimeout(res, 200));
        }

        this.recalculateStatuses(map);
        this.saveGeneratorsMap(map);

        let active = 0;
        let inactive = 0;
        let never = 0;
        for (const g of Object.values(map)) {
          if (g.status === 'TRADING') active++;
          else if (g.status === 'NOT_TRADING_RECENT') inactive++;
          else never++;
        }

        this.scrapeStatus.activeCount = active;
        this.scrapeStatus.inactiveCount = inactive;
        this.scrapeStatus.neverTradedCount = never;
        this.scrapeStatus.isRunning = false;
        this.scrapeStatus.endTime = new Date().toISOString();
        this.scrapeStatus.percent = 100;

        console.log(`[UpsldcMeaService] Scrape completed! Active: ${active}, Inactive: ${inactive}, Never: ${never}`);
      } catch (err: any) {
        console.error('[UpsldcMeaService] Fatal error during scraping:', err);
        this.scrapeStatus.isRunning = false;
        this.scrapeStatus.lastError = err.message || 'Unknown error occurred';
        this.scrapeStatus.endTime = new Date().toISOString();
      }
    })();
  }

  public static getScrapeStatus(): UpsldcScrapeStatus {
    return this.scrapeStatus;
  }
}

