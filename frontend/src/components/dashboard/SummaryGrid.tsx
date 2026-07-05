import React from 'react';
import { Box } from '@mui/material';

interface SummaryGridProps {
  children: React.ReactNode;
}

export default function SummaryGrid({ children }: SummaryGridProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'nowrap', overflowX: 'auto' }}>
      {React.Children.map(children, (child) => (
        <Box sx={{ flex: '1 1 0', minWidth: 180 }}>
          {child}
        </Box>
      ))}
    </Box>
  );
}
