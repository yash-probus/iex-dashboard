import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface DashboardTodCoverageProps {
  detail: any;
}

export const DashboardTodCoverage: React.FC<DashboardTodCoverageProps> = ({ detail }) => {
  if (!detail || !detail.tod) return null;

  const maxVal = Math.max(...detail.tod.map((t: any) => t.actualUnits));

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #dce5ef', borderRadius: '12px', height: '100%' }}>
      <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold' }}>TOD Open Access coverage</Typography>
      <Typography variant="body2" sx={{ color: '#65758b', fontSize: '11px', mb: 3 }}>Consumer-bus Open Access units as a share of actual consumption in each TOD slab</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {detail.tod.map((t: any, i: number) => {
          const widthPct = Math.max(1, (t.actualUnits / maxVal) * 100);
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ width: '40px', fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>{t.tod}</Typography>
              <Box sx={{ flexGrow: 1, position: 'relative', height: '14px', mr: 2 }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, width: `${widthPct}%`, height: '100%', bgcolor: '#f1f5f9', borderRadius: '4px' }} />
                <Box sx={{ position: 'absolute', left: 0, top: 0, width: `${(t.coverage / 100) * widthPct}%`, height: '100%', bgcolor: t.coverage > 20 ? '#10b981' : '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', px: 1 }}>
                  <Typography sx={{ color: '#fff', fontSize: '8px', fontWeight: 'bold' }}>{t.coverage > 0 ? t.coverage.toFixed(1) + '%' : ''}</Typography>
                </Box>
              </Box>
              <Typography sx={{ width: '60px', textAlign: 'right', fontSize: '9px', color: '#94a3b8' }}>{(t.actualUnits / 1000).toFixed(1)} MWh</Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
