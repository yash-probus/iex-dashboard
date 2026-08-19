import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

interface DashboardMarketMixProps {
  detail: any;
}

export const DashboardMarketMix: React.FC<DashboardMarketMixProps> = ({ detail }) => {
  const summary = detail?.marketSummary || [];
  
  const mktColor = (m: string) => m === 'DAM' ? '#eab308' : m === 'GDAM' ? '#10b981' : '#f43f5e';

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #dce5ef', borderRadius: '12px', height: '100%' }}>
      <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold' }}>Market mix</Typography>
      <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px', mb: 2 }}>Volume share, weighted rate and scheduling footprint</Typography>
      
      <Grid container spacing={2}>
        {['DAM', 'GDAM', 'RTM'].map((mkt) => {
          const s = summary.find((x: any) => x.market === mkt) || { share: 0, qtyMWh: 0, weightedRate: 0, activeSlots: 0, activeDays: 0 };
          return (
            <Grid item xs={4} key={mkt}>
              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 1.5, position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '2px', bgcolor: mktColor(mkt) }} />
                <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#1e293b' }}>{mkt}</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '20px', mt: 1 }}>{Number(s.share || 0).toFixed(1)}%</Typography>
                <Typography sx={{ fontSize: '10px', color: '#64748b', mt: 0.5 }}>{Number(s.qtyMWh || 0).toFixed(2)} MWh - ₹{Number(s.weightedRate || 0).toFixed(2)}/kWh weighted rate</Typography>
                <Typography sx={{ fontSize: '10px', color: '#94a3b8', mt: 0.5 }}>{s.activeSlots} positive slots across {s.activeDays} day(s)</Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      
      <Box sx={{ mt: 2, p: 1.5, border: '1px solid #fef08a', bgcolor: '#fefce8', borderRadius: '6px' }}>
        <Typography sx={{ fontSize: '10px', color: '#854d0e' }}>
          Market-rate calculations use positive scheduled quantity only. Zero-quantity market entries remain visible in the blockwise heatmap as light cells.
        </Typography>
      </Box>
    </Paper>
  );
};
