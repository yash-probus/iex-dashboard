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
      <Box sx={{ p: 2, borderBottom: '1px solid #dce5ef' }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold' }}>Detailed registers</Typography>
        <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px' }}>Commercial, TOD, charge and daily market records</Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #dce5ef', px: 2 }}>
        <Tab label="Commercial summary" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '12px' }} />
        <Tab label="TOD detail" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '12px' }} />
        <Tab label="OA charge register" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '12px' }} />
        <Tab label="Daily market summary" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '12px' }} />
      </Tabs>
      <Box sx={{ p: 3, bgcolor: '#fbfdff' }}>
        {tab === 0 && <CommercialSummaryTable baselineBreakdown={baselineBreakdown} detail={detail} />}
        {tab === 1 && <TodDetailTable tod={tod} />}
        {tab === 2 && <OaChargeRegisterTable oaCharges={oaCharges} />}
        {tab === 3 && <DailyMarketSummaryTable daily={daily} />}
      </Box>
    </Box>
  );
};
