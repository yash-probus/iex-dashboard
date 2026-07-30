import React from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';

interface DashboardDataTableProps {
  // We can pass the raw marketDecisionResult or clientOverview here later
  data?: any; 
}

export const DashboardDataTable: React.FC<DashboardDataTableProps> = ({ data }) => {
  const [tab, setTab] = React.useState(0);

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
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fbfdff' }}>
        <Typography variant="body2" color="text.secondary">
          Data table rendering is currently being migrated to React components.
        </Typography>
      </Box>
    </Box>
  );
};
