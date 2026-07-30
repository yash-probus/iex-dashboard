import React, { useEffect, useRef } from 'react';
import { ClientOverviewResult, MarketDecisionResult, SavingsCalculatorEntry } from '../../api/savingsCalculator.api';

interface DashboardProps {
  clientName?: string;
  calcEntry?: SavingsCalculatorEntry | null;
  clientOverview?: ClientOverviewResult | null;
  marketDecisionResult?: MarketDecisionResult | null;
  selectedMonth?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ clientName, calcEntry, clientOverview, marketDecisionResult, selectedMonth }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendMessage = () => {
      if (clientName && iframe.contentWindow) {
        
        let transformedData = null;

        if (clientOverview && clientOverview.months) {
          const validMonths = clientOverview.months.filter(m => !m.error);
          
          const overall = {
            months: validMonths.map(m => m.month),
            consumption: validMonths.map(m => m.totalEnergyKwh || 0),
            cleared: validMonths.map(m => m.totalMarketEnergyKwh || 0),
            coverage: validMonths.map(m => {
              const consumption = m.totalEnergyKwh || 1; // avoid division by zero
              return Math.round(((m.totalMarketEnergyKwh || 0) / consumption) * 100);
            }),
            discomRate: validMonths.map(() => {
              // Try to estimate discom rate from marketDecisionResult if available, else default to 7.0
              const rate = (marketDecisionResult && marketDecisionResult.totalEnergyKwh) 
                ? marketDecisionResult.totalBaselineCost / marketDecisionResult.totalEnergyKwh 
                : 7.0;
              return rate;
            }),
            platformRate: validMonths.map(m => {
              const baseRate = (marketDecisionResult && marketDecisionResult.totalEnergyKwh) 
                ? marketDecisionResult.totalBaselineCost / marketDecisionResult.totalEnergyKwh 
                : 7.0;
              const netPerUnit = (m.savings || 0) / (m.totalEnergyKwh || 1);
              return baseRate - netPerUnit;
            }),
            grossSaving: validMonths.map(m => m.grossSavings || 0),
            grossPerUnit: validMonths.map(m => (m.grossSavings || 0) / (m.totalEnergyKwh || 1)),
            fees: validMonths.map(m => (m.proltMarginCost || 0) + (m.traderMargin || 0) + (m.consultancyFee || 0) + (m.probusPlatformFee || 0)),
            netSaving: validMonths.map(m => m.savings || 0),
            netPerUnit: validMonths.map(m => (m.savings || 0) / (m.totalEnergyKwh || 1)),
          };

          let detail = null;

          if (marketDecisionResult && marketDecisionResult.slotsData) {
            // Aggregate daily data
            const dailyMap: Record<string, any> = {};
            const heatmapRecords: any[] = [];
            const marketSummaryMap: Record<string, any> = { DAM: { qtyMWh: 0, activeSlots: 0, activeDays: new Set(), sumWeighted: 0 }, GDAM: { qtyMWh: 0, activeSlots: 0, activeDays: new Set(), sumWeighted: 0 }, RTM: { qtyMWh: 0, activeSlots: 0, activeDays: new Set(), sumWeighted: 0 } };
            
            marketDecisionResult.slotsData.forEach((slot: any) => {
              // Format date: Assumes slot.date is something like "2025-03-19" or "19-03-2025", we just need the day and short month, e.g. "19-Mar"
              // Fallback to substring if it's already "19-Mar-2025"
              const dParts = slot.date.split('-');
              let dateStr = slot.date;
              if (dParts.length === 3) {
                  if (dParts[0].length === 4) dateStr = `${dParts[2]}-${new Date(slot.date).toLocaleString('en-US', {month: 'short'})}`; // 2025-03-19
                  else if (dParts[2].length === 4) dateStr = `${dParts[0]}-${new Date(dParts[2]+"-"+dParts[1]+"-"+dParts[0]).toLocaleString('en-US', {month: 'short'})}`; // 19-03-2025
                  else dateStr = slot.date.substring(0, 6); // 19-Mar-2025
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
                
                // Calculate timeStr from timeblock (1-96)
                const totalMins = (slot.timeblock - 1) * 15;
                const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
                const mm = String(totalMins % 60).padStart(2, '0');
                
                const endMins = slot.timeblock * 15;
                const ehh = endMins === 1440 ? '24' : String(Math.floor(endMins / 60)).padStart(2, '0');
                const emm = String(endMins % 60).padStart(2, '0');
                
                const timeStr = `${hh}:${mm} - ${ehh}:${emm}`;

                heatmapRecords.push({
                  date: date,
                  time: timeStr,
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

            const marketSummary = Object.keys(marketSummaryMap).map(mkt => {
              const ms = marketSummaryMap[mkt];
              return {
                market: mkt,
                qtyMWh: ms.qtyMWh,
                share: marketDecisionResult.totalMarketEnergyKwh ? (ms.qtyMWh * 1000 / marketDecisionResult.totalMarketEnergyKwh * 100) : 0,
                weightedRate: ms.qtyMWh > 0 ? ms.sumWeighted / ms.qtyMWh : 0,
                activeSlots: ms.activeSlots,
                activeDays: ms.activeDays.size
              };
            }).filter(ms => ms.qtyMWh > 0);

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

            detail = {
              month: selectedMonth && selectedMonth !== 'all' ? selectedMonth : (validMonths[validMonths.length - 1]?.month || "Current"),
              settlementPeriod: "Generated from API",
              consumption: marketDecisionResult.totalEnergyKwh,
              oaRegional: marketDecisionResult.totalMarketEnergyKwh,
              oaConsumer: marketDecisionResult.totalMarketEnergyKwh,
              oaCoverage: marketDecisionResult.totalEnergyKwh ? (marketDecisionResult.totalMarketEnergyKwh / marketDecisionResult.totalEnergyKwh * 100) : 0,
              deliveryEfficiency: 100,
              busLoss: 0,
              baselineBill: marketDecisionResult.totalBaselineCost,
              discomAfterOA: (marketDecisionResult.totalBaselineCost - marketDecisionResult.totalSavings) - marketDecisionResult.totalLandedExchangeCost,
              oaEnergyCharges: marketDecisionResult.totalLandedExchangeCost,
              oaOperatingCharges: marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0,
              oaBill: marketDecisionResult.totalLandedExchangeCost,
              combinedBill: marketDecisionResult.totalBaselineCost - marketDecisionResult.totalSavings,
              grossSaving: marketDecisionResult.totalSavings + (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0) + (marketDecisionResult.oaDetailed?.bidApplicationFees || 0),
              grossSavingPerUnit: (marketDecisionResult.totalSavings + (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0)) / (marketDecisionResult.totalEnergyKwh || 1),
              fees: {
                "Platform Fee": marketDecisionResult.oaDetailed?.bidApplicationFees || 0,
                "Operating Overheads": marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0
              },
              totalFees: (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0) + (marketDecisionResult.oaDetailed?.bidApplicationFees || 0),
              finalClientSaving: marketDecisionResult.totalSavings,
              netSavingPerUnit: marketDecisionResult.totalSavings / (marketDecisionResult.totalEnergyKwh || 1),
              customerRetention: (marketDecisionResult.totalSavings / (marketDecisionResult.totalSavings + (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0) + 1)) * 100,
              costReduction: (marketDecisionResult.totalSavings / (marketDecisionResult.totalBaselineCost || 1)) * 100,
              baselineRate: marketDecisionResult.totalBaselineCost / (marketDecisionResult.totalEnergyKwh || 1),
              combinedRate: (marketDecisionResult.totalBaselineCost - marketDecisionResult.totalSavings) / (marketDecisionResult.totalEnergyKwh || 1),
              weightedMarketRate: marketDecisionResult.totalLandedExchangeCost / (marketDecisionResult.totalMarketEnergyKwh || 1),
              positiveSlots: marketDecisionResult.slotsData.filter(s => s.marketSource && s.marketSource !== 'DISCOM').length,
              possibleSlots: marketDecisionResult.slotsData.length,
              daily,
              marketSummary,
              tod,
              baselineBreakdown: [],
              oaCharges,
              heatmapRecords
            };
          }

          transformedData = {
            overall,
            detail: detail || null
          };
        }
        
        let period = "Overall Period";
        let location = calcEntry?.address || "Location Unavailable";
        let connectivity = calcEntry?.voltageLevel || "Connectivity Unavailable";

        if (clientOverview && clientOverview.months) {
          const validMonths = clientOverview.months.filter(m => !m.error);
          if (validMonths.length > 0) {
            period = `${validMonths[0].month} – ${validMonths[validMonths.length - 1].month}`;
          }
        }
        
        iframe.contentWindow.postMessage({ 
          type: 'UPDATE_CLIENT', 
          payload: { 
            name: clientName, 
            location,
            connectivity,
            period,
            data: transformedData,
            forceView: (!selectedMonth || selectedMonth === 'all') ? 'overall' : `monthly/${selectedMonth}`
          } 
        }, '*');
      }
    };

    iframe.addEventListener('load', sendMessage);
    // Send immediately in case it's already loaded
    sendMessage();

    return () => {
      iframe.removeEventListener('load', sendMessage);
    };
  }, [clientName, clientOverview, marketDecisionResult, selectedMonth]);

  return (
    <iframe
      ref={iframeRef}
      src="/dashboard.html"
      style={{ width: '100%', height: '800px', border: 'none', borderRadius: '12px' }}
      title="Dashboard"
    />
  );
};
