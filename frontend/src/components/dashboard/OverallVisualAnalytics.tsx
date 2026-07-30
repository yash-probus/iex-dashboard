import React, { useMemo } from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import { 
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, 
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

export const OverallVisualAnalytics: React.FC<{ clientOverview: any; selectedMonth?: string }> = ({ clientOverview, selectedMonth }) => {
  if (!clientOverview || !clientOverview.months) return null;

  let validMonths = clientOverview.months.filter((m: any) => !m.error);
  if (selectedMonth && selectedMonth !== 'all') {
    validMonths = validMonths.filter((m: any) => m.month === selectedMonth);
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };
  
  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  // Process data for charts
  const chartData = validMonths.map((m: any) => {
    const coverage = m.totalEnergyKwh ? (m.totalMarketEnergyKwh || 0) / m.totalEnergyKwh * 100 : 0;
    const netRate = m.totalEnergyKwh ? m.savings / m.totalEnergyKwh : 0;
    const grossRate = m.totalEnergyKwh ? (m.grossSavings || m.savings) / m.totalEnergyKwh : 0;
    
    return {
      monthLabel: m.month,
      monthShort: m.month.split('-')[0], // e.g. "Mar-25" -> "Mar"
      clientSaving: m.savings || 0,
      grossSaving: m.grossSavings || (m.savings || 0),
      coverage: coverage,
      netRate: netRate,
      grossRate: grossRate
    };
  });

  // Calculate Insights
  const bestMonth = chartData.reduce((prev: any, current: any) => (prev.clientSaving > current.clientSaving) ? prev : current, chartData[0]);
  const strongestSpreadMonth = chartData.reduce((prev: any, current: any) => (prev.grossRate > current.grossRate) ? prev : current, chartData[0]);
  const lowestCoverageMonth = chartData.reduce((prev: any, current: any) => (prev.coverage < current.coverage) ? prev : current, chartData[0]);

  return (
    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* 1. Monthly savings and Open Access coverage */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Monthly savings and Open Access coverage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click a month in the matrix below to open its linked sub-report.
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={formatLakhs} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="grossSaving" name="Gross saving" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="clientSaving" name="Client saving" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="coverage" name="Coverage" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Overall insights
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Commercial priorities derived from the 12-month summary
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #86efac', borderLeft: '4px solid #22c55e' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Best client-saving month: {bestMonth?.month}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatLakhs(bestMonth?.clientSaving)} final saving with {bestMonth?.coverage.toFixed(0)}% OA coverage.
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Strongest price advantage: {strongestSpreadMonth?.month}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{strongestSpreadMonth?.grossRate.toFixed(2)}/kWh gross saving per consumed unit.
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #eab308' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Lowest coverage: {lowestCoverageMonth?.month}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {lowestCoverageMonth?.coverage.toFixed(0)}% OA coverage. Review scheduling, approvals, availability and forecasting constraints.
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #6366f1' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Volume and price must be optimized together</Typography>
                <Typography variant="body2" color="text.secondary">
                  High coverage does not always guarantee the highest saving if market prices are unfavorable.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
      
      {/* 2. Price spread versus coverage */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Price spread versus coverage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Months in the upper-left area offer strong price advantage but may still have volume headroom.
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" dataKey="coverage" name="Coverage" unit="%" domain={[30, 90]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="grossRate" name="Price spread" unit="₹" domain={['dataMin - 0.2', 'dataMax + 0.2']} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <ZAxis type="category" dataKey="monthShort" name="Month" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px' }} />
                <Scatter name="Months" data={chartData} fill="#3b82f6">
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.coverage < 60 && entry.grossRate > 1.0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Recommended focus
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Rules that can be implemented directly in the application
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Prioritize high-spread, sub-target months</Typography>
                <Typography variant="body2" color="text.secondary">
                  Trigger when gross saving rate is at least ₹1.00/kWh and Open Access coverage is below 65%.
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #fef08a', borderLeft: '4px solid #eab308' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Investigate low coverage</Typography>
                <Typography variant="body2" color="text.secondary">
                  Trigger below 50% coverage and route the case to forecasting, scheduling and commercial operations.
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #64748b' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Replicate high-performing procurement</Typography>
                <Typography variant="body2" color="text.secondary">
                  Capture the market mix, TOD pattern and scheduling decisions from months delivering at least ₹1.00/kWh net saving.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
      
    </Box>
  );
};
