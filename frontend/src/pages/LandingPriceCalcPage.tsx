import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function LandingPriceCalcPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Landing Price Calculator
      </Typography>
      <Paper sx={{ p: 4 }}>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          This module is connected to the backend API (`/api/landing-price-calc/calculate`), which directly interfaces with IEX APIs to calculate the landed cost.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
          UI is currently being scaffolded.
        </Typography>
      </Paper>
    </Box>
  );
}
