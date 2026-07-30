import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

interface DailyMarketSummaryTableProps {
  daily?: any[];
}

const formatNumber = (val: number) => {
  if (val === undefined || val === null) return '-';
  return val.toLocaleString('en-IN', { maximumFractionDigits: 1 });
};

const formatCurrency = (val: number) => {
  if (val === undefined || val === null) return '-';
  return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const DailyMarketSummaryTable: React.FC<DailyMarketSummaryTableProps> = ({ daily }) => {
  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #dce5ef', borderRadius: '8px', maxHeight: '500px' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>Active Slots</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>Dominant Market</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>DAM (MWh)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>GDAM (MWh)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>RTM (MWh)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b', backgroundColor: '#f8fafc' }}>Weighted Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {daily && daily.length > 0 ? (
              daily.map((row, idx) => (
                <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.date}</TableCell>
                  <TableCell align="center">{row.activeSlots}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={row.dominantMarket} 
                      size="small" 
                      sx={{ 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        backgroundColor: row.dominantMarket === 'DAM' ? '#fdf4dc' : row.dominantMarket === 'GDAM' ? '#e2f7ed' : '#fce9eb',
                        color: row.dominantMarket === 'DAM' ? '#b47306' : row.dominantMarket === 'GDAM' ? '#11734b' : '#ab3444',
                        height: '20px'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ color: row.DAM > 0 ? '#b47306' : '#cbd5e1' }}>{formatNumber(row.DAM)}</TableCell>
                  <TableCell align="right" sx={{ color: row.GDAM > 0 ? '#11734b' : '#cbd5e1' }}>{formatNumber(row.GDAM)}</TableCell>
                  <TableCell align="right" sx={{ color: row.RTM > 0 ? '#ab3444' : '#cbd5e1' }}>{formatNumber(row.RTM)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(row.weightedRate)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#94a3b8' }}>
                  No daily market data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
