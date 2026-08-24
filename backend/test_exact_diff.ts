import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from './src/modules/savings-calculator/savings-calculator.service';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function run() {
  const targetId = 'c768459c-b0d3-4e50-bbc7-d59ce388542e'; // UBIO Chemical Pvt Ltd
  const newEntry = await prisma.savingsCalculatorNewEntry.findUnique({
    where: { id: targetId }
  });

  if (!newEntry) {
    console.log("No new entry found with ID " + targetId);
    return;
  }

  console.log(`Using New Entry: ${newEntry.clientName} (${newEntry.id})`);

  // Create/Update the corresponding old entry
  const oldEntryId = 'copied-' + newEntry.id.substring(7);
  const oldEntryData = {
    id: oldEntryId,
    clientName: newEntry.clientName,
    industryName: newEntry.industryName,
    address: newEntry.address,
    sanctionedLoadKw: newEntry.sanctionedLoadKw,
    proltMargin: newEntry.proltMargin,
    traderMargin: newEntry.traderMargin,
    meteringCharges: newEntry.meteringCharges,
    consultancyFee: newEntry.consultancyFee,
    probusPlatformFee: newEntry.probusPlatformFee,
    stateCode: newEntry.stateCode,
    discom: newEntry.discom,
    consumerCategory: newEntry.consumerCategory,
    voltageLevel: newEntry.voltageLevel,
    todConsumptions: newEntry.todConsumptions as any,
    billedDemandKv: newEntry.billedDemandKv,
    powerFactor: newEntry.powerFactor,
    arrearAmount: newEntry.arrearAmount,
    currentLpsc: newEntry.currentLpsc,
    billDate: newEntry.billDate,
    applyElectricityDuty: newEntry.applyElectricityDuty
  };

  await prisma.savingsCalculatorEntry.upsert({
    where: { id: oldEntryId },
    create: oldEntryData,
    update: oldEntryData
  });

  console.log(`Upserted corresponding Old Entry: ${oldEntryId}`);

  const selectedMonth = '2026-05';
  console.log(`Running calculations for month: ${selectedMonth}`);

  const oldRes = await SavingsCalculatorService.calculateMarketDecision(oldEntryId, selectedMonth);
  const newRes = await SavingsCalculatorNewService.calculateMarketDecision(newEntry.id, selectedMonth);

  console.log("\n=================== COMPARISON ===================");
  console.log("Field | Old Calculator | New Calculator");
  console.log("-------------------------------------------------");
  console.log(`Total Energy (kWh) | ${oldRes.totalEnergyKwh} | ${newRes.totalEnergyKwh}`);
  console.log(`Market Energy (kWh) | ${oldRes.totalMarketEnergyKwh} | ${newRes.totalMarketEnergyKwh}`);
  console.log(`Baseline Cost | ${oldRes.totalBaselineCost} | ${newRes.totalBaselineCost}`);
  console.log(`Landed Exchange Cost | ${oldRes.totalLandedExchangeCost} | ${newRes.totalLandedExchangeCost}`);
  console.log(`DISCOM Cost After OA | ${oldRes.totalDiscomAfterProlt} | ${newRes.totalDiscomAfterProlt}`);
  console.log(`Gross Savings | ${oldRes.grossSavings ?? (oldRes.totalSavings + (oldRes.oaDetailed?.totals?.proltMarginCost || 0))} | ${newRes.grossSavings}`);
  console.log(`Total Savings | ${oldRes.totalSavings} | ${newRes.totalSavings}`);
  console.log(`Demand Charge | ${oldRes.demandCharge} | ${newRes.demandCharge}`);
  console.log(`Electricity Duty | ${oldRes.electricityDuty} | ${newRes.electricityDuty}`);
  console.log(`Electricity Duty (OA) | ${oldRes.electricityDutyAfterOA} | ${newRes.electricityDutyAfterOA}`);
  console.log(`FPPA Charge | ${oldRes.fppaCharge ?? (oldRes as any).fppaCharge} | ${newRes.fppaCharge}`);
  console.log(`FPPA Charge (OA) | ${oldRes.fppaChargeAfterOA ?? (oldRes as any).fppaChargeAfterOA} | ${newRes.fppaChargeAfterOA}`);
  console.log(`Daily Fixed Overhead | ${oldRes.oaDetailed?.dailyFixedOverhead} | ${newRes.oaDetailed?.dailyFixedOverhead}`);
  console.log(`Bid Application Fees | ${oldRes.oaDetailed?.bidApplicationFees} | ${newRes.oaDetailed?.bidApplicationFees}`);

  console.log("\n--- OA Detailed Totals ---");
  const oldT = oldRes.oaDetailed?.totals || {};
  const newT = newRes.oaDetailed?.totals || {};
  console.log("cssCharge:", oldT.cssCharge, "vs", newT.cssCharge);
  console.log("rpoCharge:", oldT.rpoCharge, "vs", newT.rpoCharge);
  console.log("pocCharge:", oldT.pocCharge, "vs", newT.pocCharge);
  console.log("stuCharge:", oldT.stuCharge, "vs", newT.stuCharge);
  console.log("dcCharge:", oldT.dcCharge, "vs", newT.dcCharge);
  console.log("iexFee:", oldT.iexFee, "vs", newT.iexFee);
  console.log("traderMargin:", oldT.traderMargin, "vs", newT.traderMargin);

  process.exit(0);
}

run().catch(console.error).finally(() => prisma.$disconnect());
