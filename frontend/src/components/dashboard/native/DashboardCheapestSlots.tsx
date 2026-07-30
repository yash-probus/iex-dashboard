import React from 'react';
import { Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

interface DashboardCheapestSlotsProps {
  calcResult: any;
}

export const DashboardCheapestSlots: React.FC<DashboardCheapestSlotsProps> = ({ calcResult }) => {
  if (!calcResult || !calcResult.sortedMonthlyList) return null;

  return (
    <Box sx={{ maxHeight: 400, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Date</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Time</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DAM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>GDAM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>RTM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DISCOM Rate</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Compared Lowest</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Cheapest Source</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Decision</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {calcResult.sortedMonthlyList.slice(0, 100).map((row: any, idx: number) => (
            <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
              <TableCell>{row.date}</TableCell>
              <TableCell align="center">{row.timeStr}</TableCell>
              <TableCell align="center">
                <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'text.secondary' }}>
                  {row.todSlab}
                </span>
              </TableCell>
              <TableCell align="right">₹{row.damLandingPrice > 0 ? row.damLandingPrice.toFixed(4) : '-'}</TableCell>
              <TableCell align="right">₹{row.gdamLandingPrice > 0 ? row.gdamLandingPrice.toFixed(4) : '-'}</TableCell>
              <TableCell align="right">₹{row.rtmLandingPrice > 0 ? row.rtmLandingPrice.toFixed(4) : '-'}</TableCell>
              <TableCell align="right">₹{row.discomLandingPrice.toFixed(4)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#16A34A' }}>₹{row.comparedLowestPrice.toFixed(4)}</TableCell>
              <TableCell align="center">
                <span style={{ 
                  textTransform: 'uppercase', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  color: row.selectedSource === 'DISCOM' ? '#64748B' : '#7C3AED',
                  backgroundColor: row.selectedSource === 'DISCOM' ? '#F1F5F9' : '#F5F3FF',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {row.selectedSource}
                </span>
              </TableCell>
              <TableCell align="center">
                <span style={{ 
                  textTransform: 'uppercase', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  color: row.selectedSource !== 'DISCOM' ? '#16A34A' : '#DC2626',
                  backgroundColor: row.selectedSource !== 'DISCOM' ? '#DCFCE7' : '#FEE2E2',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {row.selectedSource !== 'DISCOM' ? 'Yes' : 'No'}
                </span>
              </TableCell>
              <TableCell align="right">₹{row.optimizedCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
