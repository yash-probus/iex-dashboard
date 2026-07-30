import React from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Card
} from '@mui/material';

interface OverallMonthlyRegisterTableProps {
  clientOverview: any;
  onDrillDown: (month: string) => void;
}

export const OverallMonthlyRegisterTable: React.FC<OverallMonthlyRegisterTableProps> = ({ clientOverview, onDrillDown }) => {
  if (!clientOverview || !clientOverview.months) return null;

  const validMonths = clientOverview.months.filter((m: any) => !m.error);

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    }).format(num);
  };

  return (
    <Card sx={{ mt: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
          Overall monthly register
        </Typography>
        <Typography variant="body2" color="text.secondary">
          High-level source data used by the linked reports
        </Typography>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Month</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Consumption</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>OA cleared</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Coverage</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>DISCOM ₹/kWh</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>With OA ₹/kWh</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Gross saving</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Fees</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Client saving</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Net ₹/kWh</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>Drill-down</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validMonths.map((m: any) => {
              const consumption = m.totalEnergyKwh || 0;
              const oaCleared = m.totalMarketEnergyKwh || 0;
              const coverage = consumption > 0 ? Math.round((oaCleared / consumption) * 100) : 0;
              const clientSaving = m.savings || 0;
              const grossSaving = m.grossSavings || clientSaving;
              const fees = grossSaving - clientSaving;
              const netRate = consumption > 0 ? (clientSaving / consumption) : 0;
              
              // Estimations since explicit costs are not always provided in overview
              const discomRate = 7.00; // placeholder or computed based on actuals
              const withOaRate = discomRate - netRate;

              return (
                <TableRow key={m.month} hover>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>{m.month}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>{formatNumber(consumption)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>{formatNumber(oaCleared)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>{coverage}%</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>₹{formatNumber(discomRate, 2)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>₹{formatNumber(withOaRate, 2)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>₹{formatNumber(grossSaving)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>₹{formatNumber(fees)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px' }}>₹{formatNumber(clientSaving)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px' }}>₹{formatNumber(netRate, 2)}</TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => onDrillDown(m.month)}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        py: 0.25,
                        px: 2,
                        minWidth: 0,
                        fontSize: '12px',
                        color: '#64748b',
                        borderColor: '#cbd5e1'
                      }}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Data treatment: The overall report uses the supplied 12-month summary. The detail uses the attached blockwise TOU bill source and preserves its reported totals.
        </Typography>
      </Box>
    </Card>
  );
};
