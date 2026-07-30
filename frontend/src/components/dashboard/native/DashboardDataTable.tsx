import React from 'react';
import { Box, Typography } from '@mui/material';
import { CommercialSummaryTable } from './CommercialSummaryTable';
import { TodDetailTable } from './TodDetailTable';
import { OaChargeRegisterTable } from './OaChargeRegisterTable';
import { DailyMarketSummaryTable } from './DailyMarketSummaryTable';

interface DashboardDataTableProps {
  detail?: any; 
}

export const DashboardDataTable: React.FC<DashboardDataTableProps> = ({ detail }) => {
  const baselineBreakdown = detail?.baselineBreakdown || [];
  const tod = detail?.tod || [];
  const oaCharges = detail?.oaCharges || [];
  const daily = detail?.daily || [];

  return (
    <Box sx={{ mt: 2, border: '1px solid #dce5ef', borderRadius: '12px', bgcolor: '#fff' }}>
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold' }}>Detailed registers</Typography>
        <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px' }}>Commercial, TOD, charge and daily market records</Typography>
      </Box>

      <Box sx={{ p: 3, pt: 1, bgcolor: '#fbfdff', borderTop: '1px solid #dce5ef', borderRadius: '0 0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0f172a' }}>Commercial summary</Typography>
          <CommercialSummaryTable baselineBreakdown={baselineBreakdown} detail={detail} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0f172a' }}>TOD detail</Typography>
          <TodDetailTable tod={tod} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0f172a' }}>OA charge register</Typography>
          <OaChargeRegisterTable oaCharges={oaCharges} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0f172a' }}>Daily market summary</Typography>
          <DailyMarketSummaryTable daily={daily} />
        </Box>
      </Box>
    </Box>
  );
};
