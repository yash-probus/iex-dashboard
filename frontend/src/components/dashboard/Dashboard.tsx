import React, { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ClientOverviewResult, MarketDecisionResult, SavingsCalculatorEntry } from '../../api/savingsCalculator.api';
import { OverallVisualAnalytics } from './OverallVisualAnalytics';
import { VisualAnalyticsCharts } from '../insights/VisualAnalyticsCharts';

import { DashboardHero } from './native/DashboardHero';
import { DashboardKPIs, KPI } from './native/DashboardKPIs';
import { DashboardFlow } from './native/DashboardFlow';
import { DashboardMatrix, MonthData } from './native/DashboardMatrix';
import { DashboardDataTable } from './native/DashboardDataTable';

interface DashboardProps {
  clientName?: string;
  calcEntry?: SavingsCalculatorEntry | null;
  clientOverview?: ClientOverviewResult | null;
  marketDecisionResult?: MarketDecisionResult | null;
  demandShiftInsights?: any;
  selectedMonth?: string;
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
  selectedMonth 
}) => {
  const [activeMonth, setActiveMonth] = useState<string>(selectedMonth || 'all');

  // Compute Overall KPI Data
  const { kpis, flowData, matrixData, periodText, detailedCycle } = useMemo(() => {
    let kpis: KPI[] = [];
    let flowData = { regionalBusOA: '0', efficiency: 100, consumerOA: '0' };
    let matrixData: MonthData[] = [];
    let periodText = 'Overall Period';
    let detailedCycle = 'Generated from API';

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

      let totalConsumption = 0;
      let totalMarketEnergy = 0;
      let totalSavings = 0;
      let totalGrossSavings = 0;
      let totalBaselineCost = 0;

      validMonths.forEach(m => {
        totalConsumption += m.totalEnergyKwh || 0;
        totalMarketEnergy += m.totalMarketEnergyKwh || 0;
        totalSavings += m.savings || 0;
        totalGrossSavings += m.grossSavings || 0;
      });

      // From marketDecisionResult (monthly detailed view)
      if (marketDecisionResult) {
        totalBaselineCost = marketDecisionResult.totalBaselineCost || 0;
      }

      const oaCoverage = totalConsumption > 0 ? (totalMarketEnergy / totalConsumption) * 100 : 0;
      const blendedCost = totalConsumption > 0 ? (totalBaselineCost - totalSavings) / totalConsumption : 0;
      const netSavingRate = totalConsumption > 0 ? (totalSavings / totalConsumption) : 0;

      kpis = [
        { label: 'Client saving', value: formatIndianCurrency(totalSavings), sub: 'Summary value after fees', color: 'green' },
        { label: 'Gross saving', value: formatIndianCurrency(totalGrossSavings), sub: 'Before platform and service charges' },
        { label: 'OA coverage', value: `${oaCoverage.toFixed(1)}%`, sub: 'Consumer-bus OA energy ÷ consumption', color: 'amber' },
        { label: 'Total consumption', value: `${formatIndianNumber(totalConsumption / 1000000)} GWh`, sub: 'Billed electricity consumption' },
        { label: 'Blended cost', value: `₹${blendedCost.toFixed(2)}`, sub: 'Average blended rate per kWh' },
        { label: 'Net saving rate', value: `₹${netSavingRate.toFixed(2)}/kWh`, sub: 'Final client saving per consumed unit', color: 'green' },
      ];

      flowData = {
        regionalBusOA: `${formatIndianNumber(totalMarketEnergy / 1000)} MWh`,
        efficiency: 100, // assuming 100% since no explicit bus loss data
        consumerOA: `${formatIndianNumber(totalMarketEnergy / 1000)} MWh`
      };

      matrixData = validMonths.map(m => ({
        month: m.month,
        saving: formatIndianCurrency(m.savings || 0),
        coverage: m.totalEnergyKwh ? Math.round(((m.totalMarketEnergyKwh || 0) / m.totalEnergyKwh) * 100) : 0
      }));
    }

    return { kpis, flowData, matrixData, periodText, detailedCycle };
  }, [clientOverview, marketDecisionResult]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <DashboardHero 
        clientName={clientName || 'Energy Dashboard'}
        location={calcEntry?.address || 'Location Unavailable'}
        connectivity={calcEntry?.voltageLevel || 'Connectivity Unavailable'}
        overallPeriod={periodText}
        detailedCycle={detailedCycle}
      />

      {/* Tabs / Month Selection Matrix */}
      <Box sx={{ mt: 1 }}>
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
              fontWeight: activeMonth === 'all' ? 'bold' : 'normal',
              color: activeMonth === 'all' ? '#1769e0' : '#65758b',
              textDecoration: activeMonth === 'all' ? 'underline' : 'none',
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

      {/* KPIs & Flow (Only show in Overall, or we can filter them for month later) */}
      <Box sx={{ mt: 2 }}>
        <DashboardKPIs kpis={kpis} />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold', mb: 1 }}>
          Energy flow and Open Access delivery
        </Typography>
        <DashboardFlow 
          regionalBusOA={flowData.regionalBusOA} 
          efficiency={flowData.efficiency} 
          consumerOA={flowData.consumerOA} 
        />
      </Box>

      {/* Legacy Visual Analytics Components mapped natively */}
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Render Overall Analytics if active tab is all */}
        {(activeMonth === 'all' || activeMonth === 'overall') && clientOverview && (
          <OverallVisualAnalytics clientOverview={clientOverview} selectedMonth={selectedMonth} />
        )}

        {/* Always render VisualAnalyticsCharts to answer the user's request: "why are these 2 graphs not added" */}
        {marketDecisionResult && demandShiftInsights && (
          <Box sx={{ mt: 2, p: 3, border: '1px solid #dce5ef', borderRadius: '12px', bgcolor: '#fff' }}>
            <VisualAnalyticsCharts 
              marketDecisionResult={marketDecisionResult} 
              demandShiftInsights={demandShiftInsights}
              maxEnergyPerSlot={500} 
            />
          </Box>
        )}
      </Box>

      <DashboardDataTable />
    </Box>
  );
};
