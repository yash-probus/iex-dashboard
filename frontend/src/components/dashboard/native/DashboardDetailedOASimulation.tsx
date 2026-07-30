import React from 'react';
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface DashboardDetailedOASimulationProps {
  marketDecisionResult: any;
  exportDetailedOAToCSV: () => void;
}

export const DashboardDetailedOASimulation: React.FC<DashboardDetailedOASimulationProps> = ({ 
  marketDecisionResult,
  exportDetailedOAToCSV
}) => {
  if (!marketDecisionResult?.oaDetailed?.breakdown) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Detailed OA Savings Breakdown
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />} 
          onClick={exportDetailedOAToCSV}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Export Detailed Report CSV
        </Button>
      </Box>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Total Sourced (DISCOM Units)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Sourced (OA Units)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DISCOM Bill (Total)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Prolt DISCOM Bill (Net)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>OA Consumer Bus Units</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>OA Bill</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marketDecisionResult.oaDetailed.breakdown.map((row: any, idx: number) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{row.slabName}</TableCell>
                <TableCell align="right">{row.discomUnits.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</TableCell>
                <TableCell align="right">{row.oaUnits.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</TableCell>
                <TableCell align="right">₹{row.discomBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                <TableCell align="right">₹{row.proltDiscomBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                <TableCell align="right">{row.consumerBusUnits.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</TableCell>
                <TableCell align="right">₹{row.oaBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.discomUnits, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.oaUnits, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.discomBill, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.proltDiscomBill, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.consumerBusUnits, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.oaBill, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
      <Box sx={{ display: 'flex', gap: 4, mt: 2, p: 2, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">SLDC Scheduling Cost</Typography>
          <Typography variant="body2" fontWeight={600}>₹{(marketDecisionResult.oaDetailed.sldcSchedulingCost || 0).toLocaleString('en-IN')} ({marketDecisionResult.oaDetailed.totalDaysTraded} days)</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">NLDC Scheduling Cost</Typography>
          <Typography variant="body2" fontWeight={600}>₹{(marketDecisionResult.oaDetailed.nldcSchedulingCost || 0).toLocaleString('en-IN')} ({marketDecisionResult.oaDetailed.totalDaysTraded} days)</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Total Estimated OA Bill (Inc. Overheads)</Typography>
          <Typography variant="body2" fontWeight={700} color="#7C3AED">
            ₹{(
              marketDecisionResult.oaDetailed.breakdown.reduce((sum: number, r: any) => sum + r.oaBill, 0) + 
              marketDecisionResult.oaDetailed.dailyFixedOverhead + 
              marketDecisionResult.oaDetailed.bidApplicationFees
            ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Total Gross Bill (Net Landed OA Cost)</Typography>
          <Typography variant="body2" fontWeight={700} color="#E11D48">
            ₹{(
              marketDecisionResult.totalLandedExchangeCost + 
              marketDecisionResult.oaDetailed.dailyFixedOverhead + 
              marketDecisionResult.oaDetailed.bidApplicationFees
            ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Net Savings</Typography>
          {(() => {
            const rawSavings = marketDecisionResult.totalSavings - marketDecisionResult.oaDetailed.dailyFixedOverhead - marketDecisionResult.oaDetailed.bidApplicationFees;
            if (rawSavings <= 0) {
              return (
                <Typography variant="body2" fontWeight={700} color="#DC2626">
                  Not Eligible for OA
                </Typography>
              );
            }
            return (
              <Typography variant="body2" fontWeight={700} color="#16A34A">
                ₹{rawSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Typography>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
};
