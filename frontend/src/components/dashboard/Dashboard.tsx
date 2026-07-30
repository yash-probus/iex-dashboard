import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { ClientOverviewResult, MarketDecisionResult, SavingsCalculatorEntry } from '../../api/savingsCalculator.api';
import { OverallVisualAnalytics } from './OverallVisualAnalytics';
import { VisualAnalyticsCharts } from '../insights/VisualAnalyticsCharts';

import { DashboardHero } from './native/DashboardHero';
import { DashboardKPIs, KPI } from './native/DashboardKPIs';
import { DashboardFlow } from './native/DashboardFlow';
import { DashboardMatrix, MonthData } from './native/DashboardMatrix';
import { DashboardDataTable } from './native/DashboardDataTable';
import { DashboardMonthlyInsights } from './native/DashboardMonthlyInsights';
import { DashboardMarketMix } from './native/DashboardMarketMix';
import { DashboardBillEconomics } from './native/DashboardBillEconomics';
import { DashboardTodCoverage } from './native/DashboardTodCoverage';
import { DashboardHeatmap } from './native/DashboardHeatmap';
import { DashboardSimulationTabs } from './native/DashboardSimulationTabs';
import { DashboardEnergySummary } from './native/DashboardEnergySummary';


interface DashboardProps {
  clientName?: string;
  calcEntry?: SavingsCalculatorEntry | null;
  clientOverview?: ClientOverviewResult | null;
  marketDecisionResult?: MarketDecisionResult | null;
  demandShiftInsights?: any;
  selectedMonth?: string;
  calcResult?: any;
}

const formatIndianCurrency = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatIndianNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
  }).format(num);
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  clientName, 
  calcEntry, 
  clientOverview, 
  marketDecisionResult, 
  demandShiftInsights, 
  selectedMonth,
  calcResult
}) => {
  const [activeMonth, setActiveMonth] = useState<string>(selectedMonth || 'all');

  useEffect(() => {
    if (selectedMonth) {
      setActiveMonth(selectedMonth);
    }
  }, [selectedMonth]);

  // Compute Overall KPI Data
  const { kpis, flowData, matrixData, periodText, detailedCycle, detail, isOverall, totalConsumption, totalMarketEnergy } = useMemo(() => {
    let kpis: KPI[] = [];
    let flowData = { regionalBusOA: '0', efficiency: 100, consumerOA: '0' };
    let matrixData: MonthData[] = [];
    let periodText = 'Overall Period';
    let detailedCycle = 'Generated from API';
    let detail: any = null;
    let totalConsumption = 0;
    let totalMarketEnergy = 0;
    
    const isOverall = activeMonth === 'all' || activeMonth === 'overall';

    if (clientOverview && clientOverview.months) {
      const validMonths = clientOverview.months.filter(m => !m.error);
      
      if (validMonths.length > 0) {
        periodText = `${validMonths[0].month} – ${validMonths[validMonths.length - 1].month}`;
      }

      if (marketDecisionResult && marketDecisionResult.slotsData.length > 0) {
        const firstDate = new Date(marketDecisionResult.slotsData[0].date);
        const lastDate = new Date(marketDecisionResult.slotsData[marketDecisionResult.slotsData.length - 1].date);
        detailedCycle = `${firstDate.getDate()} ${firstDate.toLocaleString('en-US', {month: 'short'})} – ${lastDate.getDate()} ${lastDate.toLocaleString('en-US', {month: 'short'})}`;
      }

      totalConsumption = 0;
      totalMarketEnergy = 0;
      let totalSavings = 0;
      let totalGrossSavings = 0;
      let totalBaselineCost = 0;

      const monthsToProcess = isOverall ? validMonths : validMonths.filter(m => m.month === activeMonth);

      monthsToProcess.forEach(m => {
        totalConsumption += m.totalEnergyKwh || 0;
        totalMarketEnergy += m.totalMarketEnergyKwh || 0;
        totalSavings += m.savings || 0;
        totalGrossSavings += m.grossSavings || 0;
      });

      // If we are looking at a specific month and have marketDecisionResult for that month
      if (marketDecisionResult && (!isOverall)) {
        totalBaselineCost = marketDecisionResult.totalBaselineCost || 0;
      }

      const oaCoverage = totalConsumption > 0 ? (totalMarketEnergy / totalConsumption) * 100 : 0;
      const blendedCost = totalConsumption > 0 ? (totalBaselineCost - totalSavings) / totalConsumption : 0;
      const netSavingRate = totalConsumption > 0 ? (totalSavings / totalConsumption) : 0;

      // When overall, the old dashboard multiplied some things by 12/mCount for "Annual".
      // But we will stick to aggregate values here to match the old DashboardKPIs props we implemented
      kpis = [
        { label: isOverall ? 'Aggregate client saving' : 'Client saving', value: formatIndianCurrency(totalSavings), sub: 'Summary value after fees', color: 'green' },
        { label: isOverall ? 'Aggregate gross saving' : 'Gross saving', value: formatIndianCurrency(totalGrossSavings), sub: 'Before platform and service charges' },
        { label: isOverall ? 'Weighted OA coverage' : 'OA coverage', value: `${oaCoverage.toFixed(1)}%`, sub: 'Consumer-bus OA energy ÷ consumption', color: 'amber' },
        { label: 'Total consumption', value: `${formatIndianNumber(totalConsumption / 1000000)} GWh`, sub: 'Billed electricity consumption' },
        { label: 'Blended cost', value: `₹${blendedCost.toFixed(2)}`, sub: 'Average blended rate per kWh' },
        { label: 'Net saving rate', value: `₹${netSavingRate.toFixed(2)}/kWh`, sub: 'Final client saving per consumed unit', color: 'green' },
      ];

      flowData = {
        regionalBusOA: `${formatIndianNumber(totalMarketEnergy / 1000)} MWh`,
        efficiency: 100, // assuming 100% since no explicit bus loss data
        consumerOA: `${formatIndianNumber(totalMarketEnergy / 1000)} MWh`
      };

      // Matrix is always all months
      matrixData = validMonths.map(m => ({
        month: m.month,
        saving: formatIndianCurrency(m.savings || 0),
        coverage: m.totalEnergyKwh ? Math.round(((m.totalMarketEnergyKwh || 0) / m.totalEnergyKwh) * 100) : 0
      }));

      // Compute Detail (Data Tables) - only if not overall and we have detailed result
      if (!isOverall && marketDecisionResult && marketDecisionResult.slotsData) {
        const dailyMap: Record<string, any> = {};
        const heatmapRecords: any[] = [];
        const marketSummaryMap: Record<string, any> = { DAM: { qtyMWh: 0, activeSlots: 0, activeDays: new Set(), sumWeighted: 0 }, GDAM: { qtyMWh: 0, activeSlots: 0, activeDays: new Set(), sumWeighted: 0 }, RTM: { qtyMWh: 0, activeSlots: 0, activeDays: new Set(), sumWeighted: 0 } };
        
        marketDecisionResult.slotsData.forEach((slot: any) => {
          const dParts = slot.date.split('-');
          let dateStr = slot.date;
          if (dParts.length === 3) {
              if (dParts[0].length === 4) dateStr = `${dParts[2]}-${new Date(slot.date).toLocaleString('en-US', {month: 'short'})}`;
              else if (dParts[2].length === 4) dateStr = `${dParts[0]}-${new Date(dParts[2]+"-"+dParts[1]+"-"+dParts[0]).toLocaleString('en-US', {month: 'short'})}`;
              else dateStr = slot.date.substring(0, 6);
          } else if (slot.date.length > 6) {
              dateStr = slot.date.substring(0, 6);
          }
          const date = dateStr;

          if (!dailyMap[date]) {
            dailyMap[date] = { date, iso: date, qty: 0, DAM: 0, GDAM: 0, RTM: 0, activeSlots: 0, sumWeighted: 0, dominantMarket: 'DAM' };
          }
          
          if (slot.marketSource && slot.marketSource !== 'DISCOM' && slot.marketEnergy > 0) {
            const qtyMWh = slot.marketEnergy / 1000;
            const rate = slot.marketSource === 'GDAM' ? (slot.gdamLanding || 0) : slot.marketSource === 'RTM' ? (slot.rtmLanding || 0) : (slot.damLanding || 0);
            const mkt = slot.marketSource as 'DAM' | 'GDAM' | 'RTM';
            
            dailyMap[date].qty += qtyMWh;
            dailyMap[date][mkt] += qtyMWh;
            dailyMap[date].activeSlots += 1;
            dailyMap[date].sumWeighted += qtyMWh * rate;

            marketSummaryMap[mkt].qtyMWh += qtyMWh;
            marketSummaryMap[mkt].activeSlots += 1;
            marketSummaryMap[mkt].activeDays.add(date);
            marketSummaryMap[mkt].sumWeighted += qtyMWh * rate;

            heatmapRecords.push({
              date: date,
              timeblock: slot.timeblock,
              qty: qtyMWh,
              rate: rate,
              market: mkt
            });
          }
        });

        const daily = Object.values(dailyMap).map(d => {
          d.weightedRate = d.qty > 0 ? d.sumWeighted / d.qty : 0;
          d.dominantMarket = d.RTM > d.DAM && d.RTM > d.GDAM ? 'RTM' : d.GDAM > d.DAM && d.GDAM > d.RTM ? 'GDAM' : 'DAM';
          return d;
        });

        const tod = marketDecisionResult.todSummaries ? marketDecisionResult.todSummaries.map(t => ({
          tod: t.slabName,
          actualUnits: t.totalEnergyKwh || 0,
          baselineBill: (t as any).baselineCost || 0,
          oaRegional: t.marketEnergyKwh || 0,
          oaConsumer: t.marketEnergyKwh || 0,
          oaEnergyCharges: t.marketCostBase || 0,
          discomAfterOA: (t.totalEnergyKwh || 0) - (t.marketEnergyKwh || 0),
          coverage: t.totalEnergyKwh ? (t.marketEnergyKwh / t.totalEnergyKwh * 100) : 0,
          deliveredEfficiency: 100,
          avoidedDiscomBill: (t as any).savings || 0
        })) : [];

        const oaCharges = marketDecisionResult.oaDetailed?.breakdown ? marketDecisionResult.oaDetailed.breakdown.map(b => ({
          name: b.slabName,
          amount: b.oaBill,
          rate: "---",
          basis: `${b.oaUnits} kWh`
        })) : [];

        // Use the selected month from clientOverview to find fees
        const currentMonthData = clientOverview?.months?.find(m => m.month === activeMonth);
        const fees = (currentMonthData?.grossSavings || 0) - (currentMonthData?.savings || 0);
        const finalSaving = currentMonthData?.savings || marketDecisionResult.totalSavings;
        const grossSaving = currentMonthData?.grossSavings || marketDecisionResult.totalSavings;

        detail = {
          baselineBill: marketDecisionResult.totalBaselineCost,
          combinedBill: marketDecisionResult.totalBaselineCost - marketDecisionResult.totalSavings,
          finalClientSaving: finalSaving,
          totalFees: fees,
          grossSaving: grossSaving,
          customerRetention: grossSaving > 0 ? (finalSaving / grossSaving) * 100 : 0,
          discomAfterOA: (marketDecisionResult.todSummaries || []).reduce((acc: number, t: any) => acc + (t.totalEnergyKwh - t.marketEnergyKwh), 0) * 8.5, // approximate
          oaBill: (marketDecisionResult.oaDetailed?.breakdown || []).reduce((acc: number, b: any) => acc + b.oaBill, 0),
          oaEnergyCharges: (marketDecisionResult.todSummaries || []).reduce((acc: number, t: any) => acc + t.marketCostBase, 0),
          oaOperatingCharges: (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0) + (marketDecisionResult.oaDetailed?.bidApplicationFees || 0),
          daily,
          tod,
          baselineBreakdown: [],
          oaCharges,
          heatmapRecords,
          marketSummary: Object.keys(marketSummaryMap).map(mkt => ({
            market: mkt,
            qtyMWh: marketSummaryMap[mkt].qtyMWh,
            weightedRate: marketSummaryMap[mkt].qtyMWh > 0 ? marketSummaryMap[mkt].sumWeighted / marketSummaryMap[mkt].qtyMWh : 0,
            activeSlots: marketSummaryMap[mkt].activeSlots,
            activeDays: marketSummaryMap[mkt].activeDays.size,
            share: totalMarketEnergy > 0 ? ((marketSummaryMap[mkt].qtyMWh * 1000) / totalMarketEnergy) * 100 : 0
          }))
        };
      }
    }

    return { kpis, flowData, matrixData, periodText, detailedCycle, detail, isOverall, totalConsumption, totalMarketEnergy };
  }, [clientOverview, marketDecisionResult, activeMonth]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '210mm', margin: '0 auto' }}>
      <DashboardHero 
        clientName={clientName || 'Energy Dashboard'}
        location={calcEntry?.address || 'Location Unavailable'}
        connectivity={calcEntry?.voltageLevel || 'Connectivity Unavailable'}
        overallPeriod={periodText}
        detailedCycle={detailedCycle}
      />

      {/* Dynamic KPIs (Overall or Monthly depending on state) */}
      <Box sx={{ mt: 2 }}>
        <DashboardKPIs kpis={kpis} />
      </Box>

      {/* Energy Summary (Overall or Monthly) */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <DashboardEnergySummary 
          calcResult={{
            totalEnergyKwh: totalConsumption,
            totalMarketEnergyKwh: totalMarketEnergy
          }} 
          marketDecisionResult={isOverall ? null : marketDecisionResult} 
        />
      </Box>

      {/* Tabs / Month Selection Matrix (Always shown to allow switching) */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold' }}>
            Monthly savings and Open Access coverage
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography 
            onClick={() => setActiveMonth('all')}
            sx={{ 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: isOverall ? 'bold' : 'normal',
              color: isOverall ? '#1769e0' : '#65758b',
              textDecoration: isOverall ? 'underline' : 'none',
              textUnderlineOffset: '4px'
            }}
          >
            View Overall Report
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#65758b', mb: 2, mt: -1 }}>
          Click a month in the matrix below to open its linked sub-report.
        </Typography>
        <DashboardMatrix 
          months={matrixData} 
          activeMonth={activeMonth} 
          onMonthClick={(m) => setActiveMonth(m)} 
        />
      </Box>

      {/* Monthly-only components */}
      {!isOverall && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Energy Flow & Monthly Insights Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold', mb: 1 }}>
                Energy flow and Open Access delivery
              </Typography>
              <DashboardFlow 
                regionalBusOA={flowData.regionalBusOA} 
                efficiency={flowData.efficiency} 
                consumerOA={flowData.consumerOA} 
              />
            </Box>
            <Box>
              <DashboardMonthlyInsights detail={detail} />
            </Box>
          </Box>

          {/* Visual Analytics Charts & Market Mix */}
          {marketDecisionResult && (
            <>
              <Box sx={{ p: 3, border: '1px solid #dce5ef', borderRadius: '12px', bgcolor: '#fff' }}>
                <VisualAnalyticsCharts 
                  marketDecisionResult={marketDecisionResult} 
                  demandShiftInsights={demandShiftInsights || { slotsData: [] }}
                  maxEnergyPerSlot={500} 
                />
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <DashboardMarketMix detail={detail} />
                <DashboardBillEconomics detail={detail} />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
                <DashboardTodCoverage detail={detail} />
              </Box>
              
              <Box>
                <DashboardHeatmap detail={detail} />
              </Box>
            </>
          )}

          {detail && <DashboardDataTable detail={detail} />}
          
          <DashboardSimulationTabs 
            calcResult={calcResult}
            marketDecisionResult={marketDecisionResult}
            demandShiftInsights={demandShiftInsights}
          />
        </Box>
      )}

      {/* Overall-only components */}
      {isOverall && clientOverview && (
        <Box sx={{ mt: 4 }}>
          <OverallVisualAnalytics clientOverview={clientOverview} selectedMonth={selectedMonth} />
        </Box>
      )}

    </Box>
  );
};
