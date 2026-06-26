import React from 'react';
import { Grid } from '@mui/material';

interface SummaryGridProps {
  children: React.ReactNode;
}

export default function SummaryGrid({ children }: SummaryGridProps) {
  return (
    <Grid container spacing={2}>
      {React.Children.map(children, (child) => (
        <Grid item xs={12} sm={6} md={3}>
          {child}
        </Grid>
      ))}
    </Grid>
  );
}
