import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { MarketDecisionResult, MarketDecisionSlot } from '../../api/savingsCalculator.api';

interface SavingsDashboardProps {
  result: MarketDecisionResult;
  monthStr: string; // e.g. "2026-07"
}

export const SavingsDashboard: React.FC<SavingsDashboardProps> = ({ result, monthStr }) => {
  // Aggregate daily data
  const dailyData = useMemo(() => {
    const days: Record<string, any> = {};
    const slots = result.slotsData || [];
    
    // Calculate energy per slot
    // We assume the total energy is evenly distributed over the month's slots
    const totalSlots = slots.length || 1;
    const energyPerSlot = result.totalEnergyKwh / totalSlots;

    slots.forEach((slot: any) => {
      const dateKey = slot.date;
      if (!days[dateKey]) {
        days[dateKey] = {
          date: dateKey,
          dayLabel: `Day ${dateKey.substring(8, 10)}`,
          totalUnits: 0,
          oaUnits: 0,
          discomUnits: 0,
          actualSpend: 0,
          proltSpend: 0,
          savings: 0,
        };
      }
      
      // Use exact slot energies if available, otherwise fallback
      const marketEnergy = slot.marketEnergy || 0;
      const discomEnergy = slot.discomEnergy || 0;
      let totalSlotEnergy = marketEnergy + discomEnergy;
      if (totalSlotEnergy === 0) {
        totalSlotEnergy = energyPerSlot;
      }
      
      days[dateKey].totalUnits += totalSlotEnergy;
      
      const discomCostForSlot = totalSlotEnergy * slot.discomLanding;
      days[dateKey].actualSpend += discomCostForSlot;
      
      if (slot.shouldBuyFromMarket && slot.bestMarketLanding > 0) {
        days[dateKey].oaUnits += totalSlotEnergy;
        days[dateKey].proltSpend += totalSlotEnergy * slot.bestMarketLanding;
      } else {
        days[dateKey].discomUnits += totalSlotEnergy;
        days[dateKey].proltSpend += discomCostForSlot;
      }
    });

    // Scale daily prolt spend to match totalLandedExchangeCost
    const rawTotalProlt = Object.values(days).reduce((acc: number, cur: any) => acc + cur.proltSpend, 0);
    const scaleFactor = rawTotalProlt > 0 ? (result.totalLandedExchangeCost / rawTotalProlt) : 1;

    Object.values(days).forEach((day: any) => {
      day.proltSpend = day.proltSpend * scaleFactor;
      day.savings = day.actualSpend - day.proltSpend;
    });

    
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [result]);

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)}L`; // Lakhs
  const formatThousands = (val: number) => `₹${(val / 1000).toFixed(2)}K`;

  const savingsPerc = ((result.totalSavings / result.totalBaselineCost) * 100).toFixed(2);
  const isPositiveSavings = result.totalSavings > 0;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Banner */}
      <Box sx={{ textAlign: 'center', p: 3, bgcolor: isPositiveSavings ? '#ECFDF5' : '#FEF2F2', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ color: isPositiveSavings ? '#059669' : '#DC2626', fontWeight: 700, mb: 1 }}>
          {isPositiveSavings ? '🎉 Great news! Your bill could drop by' : 'Analysis Complete'}
        </Typography>
        <Typography variant="h3" sx={{ color: isPositiveSavings ? '#059669' : '#DC2626', fontWeight: 800 }}>
          {result.totalSavings >= 100000 ? formatCurrency(result.totalSavings) : formatThousands(result.totalSavings)}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          ({savingsPerc}% {isPositiveSavings ? 'reduction' : 'change'}) Total potential savings for {monthStr}.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Actual Spend</Typography>
              <Typography variant="h4" fontWeight="bold">{formatCurrency(result.totalBaselineCost)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#F3F4F6', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Prolt Optimized Spend</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">{formatCurrency(result.totalLandedExchangeCost)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="body2" color="text.secondary" align="center">
        Total Units : {result.totalEnergyKwh.toLocaleString()} kWh analyzed
      </Typography>

      {/* Graph Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Consumption Mix - DISCOM Vs OA</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Actual', DISCOM: result.totalEnergyKwh, OA: 0 },
                      { name: 'Prolt Optimized', DISCOM: result.totalEnergyKwh - result.totalMarketEnergyKwh, OA: result.totalMarketEnergyKwh }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Legend />
                    <Bar dataKey="DISCOM" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="OA" stackId="a" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
           <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>Cost Vs Consumption</Typography>
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary">Current Rate</Typography>
                  <Typography variant="h3" fontWeight="bold">₹{(result.totalBaselineCost / result.totalEnergyKwh).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">/kWh</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary">Optimized Rate</Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary">₹{(result.totalLandedExchangeCost / result.totalEnergyKwh).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">/kWh</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Graph Area 2 */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Daily Savings Opportunity (Energy Cost)</Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dayLabel" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="actualSpend" name="Actual Spend" stroke="#EF4444" fillOpacity={0} />
                <Area type="monotone" dataKey="proltSpend" name="Prolt Optimized Spend" stroke="#3B82F6" fillOpacity={0} />
                <Area type="monotone" dataKey="savings" name="Saving Zone" stroke="#10B981" fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Daily Breakdown Table */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Prolt Suggested Daily Breakdown</Typography>
          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell align="right">Total Units</TableCell>
                  <TableCell align="right">OA Units</TableCell>
                  <TableCell align="right">DISCOM Units</TableCell>
                  <TableCell align="right">You Paid</TableCell>
                  <TableCell align="right">Prolt Suggested</TableCell>
                  <TableCell align="right">Savings</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailyData.map((row) => (
                  <TableRow key={row.date} hover>
                    <TableCell>{row.dayLabel}</TableCell>
                    <TableCell align="right">{row.totalUnits.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.oaUnits.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.discomUnits.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{row.actualSpend.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{row.proltSpend.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: row.savings > 0 ? '#10B981' : 'inherit', fontWeight: row.savings > 0 ? 'bold' : 'normal' }}>
                      ₹{row.savings.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
