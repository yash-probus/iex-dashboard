import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Dashboard } from '../components/dashboard/Dashboard';

export default function CustomerLeadPage() {
  const [selectedMonth, setSelectedMonth] = useState('overall');

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Customer Lead Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of customer lead savings analysis.
        </Typography>
      </Box>

      {/* Embedded Dashboard View */}
      <Box sx={{ width: '100%', minHeight: '800px', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 2 }}>
        <Dashboard 
          calcEntry={null as any} 
          clientName="Customer Lead View" 
          clientOverview={null as any} 
          marketDecisionResult={null as any} 
          selectedMonth={selectedMonth} 
        />
      </Box>
    </Box>
  );
}
