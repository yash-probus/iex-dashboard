import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface DashboardHeatmapProps {
  detail: any;
}

export const DashboardHeatmap: React.FC<DashboardHeatmapProps> = ({ detail }) => {
  if (!detail || !detail.heatmapRecords || !detail.daily) return null;

  const records = detail.heatmapRecords;
  const days = detail.daily.map((d: any) => d.date);

  // Timeblocks: 1 to 96
  const blocks = Array.from({ length: 96 }, (_, i) => i + 1);

  const getCellData = (date: string, block: number) => {
    return records.find((r: any) => r.date === date && r.timeblock === block);
  };

  const getHourLabel = (block: number) => {
    if (block % 4 === 1) {
      const hour = Math.floor(block / 4);
      return String(hour).padStart(2, '0') + ':00';
    }
    return '';
  };

  const mktColor = (m: string) => m === 'DAM' ? '#eab308' : m === 'GDAM' ? '#10b981' : m === 'RTM' ? '#f43f5e' : '#fef08a';

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #dce5ef', borderRadius: '12px', width: '100%' }}>
      <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold' }}>Blockwise market activity heatmap</Typography>
      <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px', mb: 3 }}>
        {days.length} days x 96 time blocks. Hover any colored cell for market, quantity and rate.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: '#eab308', borderRadius: '1px' }}/><Typography sx={{ fontSize: '9px' }}>DAM</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '1px' }}/><Typography sx={{ fontSize: '9px' }}>GDAM</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: '#f43f5e', borderRadius: '1px' }}/><Typography sx={{ fontSize: '9px' }}>RTM</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: '#fef08a', borderRadius: '1px' }}/><Typography sx={{ fontSize: '9px' }}>Light cell = zero scheduled quantity</Typography></Box>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `40px repeat(${days.length}, 1fr)`, gap: '2px', mb: '4px' }}>
          <Box />
          {days.map((d: string) => (
            <Typography key={d} sx={{ fontSize: '8px', color: '#64748b', transform: 'rotate(-45deg)', transformOrigin: 'bottom left', mt: 2, mb: 1, whiteSpace: 'nowrap' }}>{d}</Typography>
          ))}
        </Box>
        
        {blocks.map(block => {
          const hourLabel = getHourLabel(block);
          return (
            <Box key={block} sx={{ display: 'grid', gridTemplateColumns: `40px repeat(${days.length}, 1fr)`, gap: '2px', mb: '2px' }}>
              <Typography sx={{ fontSize: '8px', color: '#94a3b8', textAlign: 'right', pr: 1, pt: '0px' }}>{hourLabel}</Typography>
              {days.map((day: string) => {
                const cell = getCellData(day, block);
                return (
                  <Box 
                    key={`${day}-${block}`} 
                    title={cell ? `Block ${block} | ${cell.market} | ${cell.qty.toFixed(2)} MWh | ₹${cell.rate.toFixed(2)}` : ''}
                    sx={{ 
                      bgcolor: cell ? mktColor(cell.market) : 'transparent',
                      border: cell ? 'none' : '1px solid #f1f5f9',
                      height: '8px',
                      opacity: cell && cell.qty === 0 ? 0.3 : 1
                    }} 
                  />
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
