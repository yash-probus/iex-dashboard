import React from 'react';
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

interface DashboardMarketBuyDecisionProps {
  marketDecisionResult: any;
  setGraphDialogOpen: (open: boolean) => void;
}

export const DashboardMarketBuyDecision: React.FC<DashboardMarketBuyDecisionProps> = ({ 
  marketDecisionResult, 
  setGraphDialogOpen 
}) => {
  if (!marketDecisionResult) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Slot-wise Market Simulation
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BarChartIcon />}
          onClick={() => setGraphDialogOpen(true)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          View Daily Simulation Graph
        </Button>
      </Box>
      
      <Box sx={{ maxHeight: 500, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Time</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Source</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Landing (₹)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DISCOM Landing (₹)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Buy from Market?</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Savings/kWh (₹)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marketDecisionResult.slotsData?.slice(0, 150).map((row: any, idx: number) => {
              const isOaEligible = (marketDecisionResult.totalSavings - (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0) - (marketDecisionResult.oaDetailed?.bidApplicationFees || 0)) > 0;
              const buyDecision = isOaEligible && row.shouldBuyFromMarket;
              
              return (
                <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="center">{row.timeStr || `${String(row.hour).padStart(2, '0')}:${String((row.timeblock - 1) * 15 % 60).padStart(2, '0')}`}</TableCell>
                  <TableCell align="center">
                    <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'text.secondary' }}>
                      {row.tod}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ 
                      textTransform: 'uppercase', 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      color: row.marketSource === 'DAM' ? '#3B82F6' : row.marketSource === 'GDAM' ? '#10B981' : '#8B5CF6',
                      backgroundColor: row.marketSource === 'DAM' ? '#EFF6FF' : row.marketSource === 'GDAM' ? '#ECFDF5' : '#F5F3FF',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {row.marketSource}
                    </span>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.bestMarketLanding > 0 ? row.bestMarketLanding.toFixed(4) : '-'}</TableCell>
                  <TableCell align="right">₹{row.discomLanding.toFixed(4)}</TableCell>
                  <TableCell align="center">
                    <span style={{ 
                      textTransform: 'uppercase', 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      color: buyDecision ? '#16A34A' : '#DC2626',
                      backgroundColor: buyDecision ? '#DCFCE7' : '#FEE2E2',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {buyDecision ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: row.savingsPerKwh > 0 ? '#16A34A' : 'inherit' }}>
                    {row.savingsPerKwh > 0 ? `₹${row.savingsPerKwh.toFixed(4)}` : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};
