import React from 'react';
import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

interface DashboardCheapestSlotsProps {
  calcResult: any;
}

export const DashboardCheapestSlots: React.FC<DashboardCheapestSlotsProps> = ({ calcResult }) => {
  if (!calcResult || !calcResult.sortedMonthlyList) return null;

  return (
    <Box sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 400, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>Date</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>Time</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>TOD</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>DAM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>GDAM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>RTM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>DISCOM<br/>Rate</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>Lowest<br/>Price</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>Source</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>Buy?</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC', fontSize: '11px', px: 1 }}>Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {calcResult.sortedMonthlyList.slice(0, 100).map((row: any, idx: number) => (
            <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
              <TableCell sx={{ fontSize: '11px', px: 1 }}>{row.date}</TableCell>
              <TableCell align="center" sx={{ fontSize: '11px', px: 1 }}>{row.timeStr}</TableCell>
              <TableCell align="center" sx={{ px: 1 }}>
                <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                  {row.todSlab}
                </span>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', px: 1 }}>₹{row.damLandingPrice > 0 ? row.damLandingPrice.toFixed(2) : '-'}</TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', px: 1 }}>₹{row.gdamLandingPrice > 0 ? row.gdamLandingPrice.toFixed(2) : '-'}</TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', px: 1 }}>₹{row.rtmLandingPrice > 0 ? row.rtmLandingPrice.toFixed(2) : '-'}</TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', px: 1 }}>₹{row.discomLandingPrice.toFixed(2)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#16A34A', fontSize: '11px', px: 1 }}>₹{row.comparedLowestPrice.toFixed(2)}</TableCell>
              <TableCell align="center" sx={{ px: 1 }}>
                <span style={{ 
                  textTransform: 'uppercase', 
                  fontSize: '9px', 
                  fontWeight: 800, 
                  color: row.selectedSource === 'DISCOM' ? '#64748B' : '#7C3AED',
                  backgroundColor: row.selectedSource === 'DISCOM' ? '#F1F5F9' : '#F5F3FF',
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}>
                  {row.selectedSource}
                </span>
              </TableCell>
              <TableCell align="center" sx={{ px: 1 }}>
                <span style={{ 
                  textTransform: 'uppercase', 
                  fontSize: '9px', 
                  fontWeight: 800, 
                  color: row.selectedSource !== 'DISCOM' ? '#16A34A' : '#DC2626',
                  backgroundColor: row.selectedSource !== 'DISCOM' ? '#DCFCE7' : '#FEE2E2',
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}>
                  {row.selectedSource !== 'DISCOM' ? 'Y' : 'N'}
                </span>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '11px', px: 1 }}>₹{row.optimizedCost.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
