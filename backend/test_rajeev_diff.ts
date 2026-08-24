import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function run() {
  const rajeevId = '6f8931eb-378a-490b-a213-0546504ad486';
  const oldEntry = await prisma.savingsCalculatorEntry.findUnique({ where: { id: rajeevId } });
  if (!oldEntry) return;

  const oldCons = oldEntry.todConsumptions as any;
  const monthKey = '2026-05';
  const monthData = oldCons[monthKey];

  const slotsKeys = ["3:00-5:00", "19:00-3:00", "5:00-10:00", "10:00-19:00"];
  const newSlots = slotsKeys.map((key, idx) => {
    const val = monthData[key];
    const [start, end] = key.split('-');
    const parseTime = (t: string) => {
      const [h, m] = t.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };
    return {
      id: `tod-${idx + 1}`,
      name: key.toUpperCase(),
      startTime: parseTime(start),
      endTime: parseTime(end),
      consumptionKwh: Number(val),
      effectivePrice: key === "19:00-3:00" ? 7.48 : (key === "10:00-19:00" ? 6.8 : (key === "5:00-10:00" ? 5.78 : 6.8))
    };
  });

  const newConsumptions = {
    _meta: { fppaChargePercent: 10, demandChargeKwRate: 290, electricityDutyPercent: 7.5 },
    [monthKey]: {
      slots: newSlots,
      startDate: monthData["Start Date"] || "2026-05-01",
      endDate: monthData["End Date"] || "2026-05-31",
      peakDemandKw: Number(monthData["Peak Demand (kVA)"] || 675)
    }
  };

  const newEntryId = 'copied-new-' + oldEntry.id.substring(11);
  const newEntryData = {
    id: newEntryId,
    clientName: oldEntry.clientName,
    industryName: oldEntry.industryName,
    address: oldEntry.address,
    sanctionedLoadKw: oldEntry.sanctionedLoadKw,
    proltMargin: oldEntry.proltMargin,
    traderMargin: oldEntry.traderMargin,
    meteringCharges: oldEntry.meteringCharges,
    consultancyFee: oldEntry.consultancyFee,
    probusPlatformFee: oldEntry.probusPlatformFee,
    stateCode: oldEntry.stateCode,
    discom: oldEntry.discom,
    consumerCategory: oldEntry.consumerCategory,
    voltageLevel: oldEntry.voltageLevel,
    todConsumptions: newConsumptions as any,
    billedDemandKv: oldEntry.billedDemandKv,
    powerFactor: oldEntry.powerFactor,
    arrearAmount: oldEntry.arrearAmount,
    currentLpsc: oldEntry.currentLpsc,
    billDate: oldEntry.billDate,
    applyElectricityDuty: oldEntry.applyElectricityDuty
  };

  await prisma.savingsCalculatorNewEntry.upsert({
    where: { id: newEntryId },
    create: newEntryData,
    update: newEntryData
  });

  const oldRes = await SavingsCalculatorService.calculateMarketDecision(oldEntry.id, monthKey);
  const newRes = await SavingsCalculatorNewService.calculateMarketDecision(newEntryId, monthKey);

  // Compare slot-by-slot decisions for all slots to find divergence
  console.log("\n--- DIVERGENT SLOTS (First 15 divergent slots) ---");
  let count = 0;
  for (let i = 0; i < oldRes.slotsData.length; i++) {
    const os = oldRes.slotsData[i];
    const ns = newRes.slotsData[i];
    const oldBuy = os.shouldBuyFromMarket;
    const newBuy = ns.selectedSource !== 'DISCOM';
    
    if (oldBuy !== newBuy) {
      console.log(`\nSlot at Date ${os.date}, Timeblock ${os.timeblock} (${os.tod}):`);
      console.log(`  Old: Buy=${oldBuy}, Source=${os.marketSource}, bestMarketLanding=${os.bestMarketLanding?.toFixed(2)}, discomLanding=${os.discomLanding?.toFixed(2)}, marketEnergy=${(os as any).marketEnergy?.toFixed(2)}, discomEnergy=${(os as any).discomEnergy?.toFixed(2)}`);
      console.log(`  New: Buy=${newBuy}, Source=${ns.selectedSource}, comparedLowestPrice=${ns.comparedLowestPrice?.toFixed(2)}, discomLandingPrice=${ns.discomLandingPrice?.toFixed(2)}, marketEnergy=${ns.marketEnergy?.toFixed(2)}, discomEnergy=${ns.discomEnergy?.toFixed(2)}`);
      count++;
      if (count >= 15) break;
    }
  }

  process.exit(0);
}

run().catch(console.error).finally(() => prisma.$disconnect());
