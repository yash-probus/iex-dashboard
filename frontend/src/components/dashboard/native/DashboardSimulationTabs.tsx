import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { DashboardSlabsGroupSummary } from './DashboardSlabsGroupSummary';
import { DashboardCheapestSlots } from './DashboardCheapestSlots';
import { DashboardMarketBuyDecision } from './DashboardMarketBuyDecision';
import { DashboardDetailedOASimulation } from './DashboardDetailedOASimulation';
import { DashboardUsageRecommendations } from './DashboardUsageRecommendations';

interface DashboardSimulationTabsProps {
  calcResult?: any;
  marketDecisionResult?: any;
  demandShiftInsights?: any;
}

export const DashboardSimulationTabs: React.FC<DashboardSimulationTabsProps> = ({ 
  calcResult, 
  marketDecisionResult, 
  demandShiftInsights 
}) => {
  const [tab, setTab] = useState(0);
  
  // Handlers for dialogs and exports (mocked or handled internally if needed, or pass them in)
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [demandShiftGraphOpen, setDemandShiftGraphOpen] = useState(false);
  const [dynamicDemandShiftGraphOpen, setDynamicDemandShiftGraphOpen] = useState(false);

  const handleExportDetailedOA = () => {
    // We can implement actual export here if needed, or just let it fail gracefully
    console.log('Export Detailed OA CSV');
  };

  const handleExportInsights = () => {
    console.log('Export Insights Excel');
  };

  return (
    <Box sx={{ mt: 3, mb: 3 }}>
      <Box sx={{ p: 3, border: '1px solid #dce5ef', borderRadius: '12px', bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold' }}>Simulation Details</Typography>
        <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px', mb: 2 }}>
          Detailed breakdown of market decisions, TOD shifting, and OA calculations
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
            <Tab label="Slabs Group Summary" disabled={!calcResult} value={0} />
            <Tab label="Cheapest Slots" disabled={!calcResult} value={1} />
            <Tab label="Market Buy Decision" disabled={!marketDecisionResult} value={2} />
            <Tab label="Detailed OA Simulation" disabled={!marketDecisionResult?.oaDetailed} value={3} />
            <Tab label="Usage Recommendations" disabled={!demandShiftInsights} value={4} />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {tab === 0 && <DashboardSlabsGroupSummary calcResult={calcResult} />}
          {tab === 1 && <DashboardCheapestSlots calcResult={calcResult} />}
          {tab === 2 && (
            <DashboardMarketBuyDecision 
              marketDecisionResult={marketDecisionResult} 
              setGraphDialogOpen={setGraphDialogOpen} 
            />
          )}
          {tab === 3 && (
            <DashboardDetailedOASimulation 
              marketDecisionResult={marketDecisionResult} 
              exportDetailedOAToCSV={handleExportDetailedOA} 
            />
          )}
          {tab === 4 && (
            <DashboardUsageRecommendations 
              demandShiftInsights={demandShiftInsights}
              marketDecisionResult={marketDecisionResult}
              setDemandShiftGraphOpen={setDemandShiftGraphOpen}
              setDynamicDemandShiftGraphOpen={setDynamicDemandShiftGraphOpen}
              exportInsightsToExcel={handleExportInsights}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
