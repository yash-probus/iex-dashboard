import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { CommercialSummaryTable } from './CommercialSummaryTable';
import { TodDetailTable } from './TodDetailTable';
import { OaChargeRegisterTable } from './OaChargeRegisterTable';
import { DailyMarketSummaryTable } from './DailyMarketSummaryTable';

interface DashboardDataTableProps {
  detail?: any; 
}

export const DashboardDataTable: React.FC<DashboardDataTableProps> = ({ detail }) => {
  const [tab, setTab] = useState(0);

  const baselineBreakdown = detail?.baselineBreakdown || [];
  const tod = detail?.tod || [];
  const oaCharges = detail?.oaCharges || [];
  const daily = detail?.daily || [];

  return (
    <Box sx={{ mt: 2, border: '1px solid #dce5ef', borderRadius: '12px', bgcolor: '#fff' }}>
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold' }}>Detailed registers</Typography>
        <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px', mb: 2 }}>Commercial, TOD, charge and daily market records</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TabButton active={tab === 0} label="Commercial summary" onClick={() => setTab(0)} />
          <TabButton active={tab === 1} label="TOD detail" onClick={() => setTab(1)} />
          <TabButton active={tab === 2} label="OA charge register" onClick={() => setTab(2)} />
          <TabButton active={tab === 3} label="Daily market summary" onClick={() => setTab(3)} />
        </Box>
      </Box>

      <Box sx={{ p: 3, pt: 1, bgcolor: '#fbfdff', borderTop: '1px solid #dce5ef', borderRadius: '0 0 12px 12px' }}>
        {tab === 0 && <CommercialSummaryTable baselineBreakdown={baselineBreakdown} detail={detail} />}
        {tab === 1 && <TodDetailTable tod={tod} />}
        {tab === 2 && <OaChargeRegisterTable oaCharges={oaCharges} />}
        {tab === 3 && <DailyMarketSummaryTable daily={daily} />}
      </Box>
    </Box>
  );
};

const TabButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <Box 
    onClick={onClick}
    sx={{ 
      px: 2, py: 0.5, 
      border: '1px solid', 
      borderColor: active ? '#0f172a' : '#cbd5e1', 
      bgcolor: active ? '#0f172a' : '#fff', 
      color: active ? '#fff' : '#475569', 
      borderRadius: '6px', 
      cursor: 'pointer', 
      fontSize: '11px', 
      fontWeight: 'bold',
      '&:hover': { bgcolor: active ? '#0f172a' : '#f8fafc' }
    }}
  >
    {label}
  </Box>
);
