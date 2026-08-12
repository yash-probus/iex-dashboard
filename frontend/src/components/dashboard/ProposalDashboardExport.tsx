import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ClientOverviewResult, MarketDecisionResult, DemandShiftInsightsResult } from '../../api/savingsCalculator.api';
import './proposal-dashboard.css';
import { VisualAnalyticsCharts } from '../insights/VisualAnalyticsCharts';

interface ProposalDashboardExportProps {
  clientOverview: ClientOverviewResult | null;
  marketDecisionResult: MarketDecisionResult | null;
  demandShiftInsights: DemandShiftInsightsResult | null;
  selectedMonth: string;
}

const formatIndianCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatLakhs = (num: number) => {
    return (num / 100000).toFixed(2) + 'L';
  };

export const ProposalDashboardExport: React.FC<ProposalDashboardExportProps> = ({
  clientOverview,
  marketDecisionResult,
  demandShiftInsights,
  selectedMonth
}) => {
  const { 
    totalSavings, 
    reductionPct, 
    actualSpend, 
    optimizedSpend, 
    totalUnits, 
    monthLabel 
  } = useMemo(() => {
    let totalSavings = 0;
    let actualSpend = 0;
    let optimizedSpend = 0;
    let totalUnits = 0;
    let monthLabel = selectedMonth || 'Overall';

    if (marketDecisionResult) {
      totalSavings = marketDecisionResult.totalSavings || 0;
      actualSpend = marketDecisionResult.totalBaselineCost || 0;
      optimizedSpend = actualSpend - totalSavings;
      
      marketDecisionResult.todSummaries?.forEach(t => {
        totalUnits += t.totalEnergyKwh || 0;
      });
    }

    const reductionPct = actualSpend > 0 ? ((totalSavings / actualSpend) * 100).toFixed(2) : '0.00';

    return { totalSavings, reductionPct, actualSpend, optimizedSpend, totalUnits, monthLabel };
  }, [marketDecisionResult, selectedMonth]);

  if (!marketDecisionResult) return null;

  return (
    <div className="dashboard-container" style={{ width: '1200px', backgroundColor: '#f8fafc', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* Banner */}
        <div className="savings-banner">
            <div className="headline">
                <span role="img" aria-label="party">🎉</span> Great news! Your bill could drop by <span className="amount">₹{formatLakhs(totalSavings)}</span> <span className="badge">({reductionPct}% reduction)</span>
            </div>
            <div className="subhead">
                Total potential savings for {monthLabel.toUpperCase()}.
            </div>
            
            <div className="spend-comparison">
                <div className="spend-box">
                    <div className="label">ACTUAL SPEND</div>
                    <div className="value">₹{formatLakhs(actualSpend)}</div>
                </div>
                <div className="arrow-icon">→</div>
                <div className="spend-box optimized">
                    <div className="label">PROLT OPTIMIZED SPEND</div>
                    <div className="value">₹{formatLakhs(optimizedSpend)}</div>
                </div>
            </div>

            <div className="analyzed-units">
                Total Units : <strong>{Math.round(totalUnits)} kWh</strong> analyzed
            </div>
        </div>

        {/* Charts */}
        <div style={{ pointerEvents: 'none' }}>
            <VisualAnalyticsCharts 
                marketDecisionResult={marketDecisionResult} 
                demandShiftInsights={demandShiftInsights || ({ slotsData: [] } as any)}
                maxEnergyPerSlot={500} 
            />
        </div>
    </div>
  );
};
