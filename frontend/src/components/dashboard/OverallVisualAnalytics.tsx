import React, { useMemo } from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { 
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, 
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

export const OverallVisualAnalytics: React.FC<{ clientOverview: any; selectedMonth?: string }> = ({ clientOverview, selectedMonth }) => {
  if (!clientOverview || !clientOverview.months) return null;

  const formatMonthLabel = (rawMonth: string) => {
    if (!rawMonth) return rawMonth;

    // Handles "YYYY-MM" format (e.g. 2025-10)
    const yyyyMm = rawMonth.match(/^(\d{4})-(\d{2})$/);
    if (yyyyMm) {
      const year = Number(yyyyMm[1]);
      const month = Number(yyyyMm[2]);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }

    // Handles "Mon-YY" format (e.g. Mar-25)
    const monYy = rawMonth.match(/^([A-Za-z]{3})-(\d{2})$/);
    if (monYy) {
      const year = 2000 + Number(monYy[2]);
      return `${monYy[1]} ${year}`;
    }

    return rawMonth;
  };

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

  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const renderSpreadTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          px: 1.5,
          py: 1,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}
      >
        <Typography variant="body2">Coverage: {Number(point.coverage || 0).toFixed(2)}%</Typography>
        <Typography variant="body2">Price spread: ₹{Number(point.grossRate || 0).toFixed(2)}/kWh</Typography>
        <Typography variant="body2">Month: {formatMonthLabel(point.monthLabel)}</Typography>
      </Box>
    );
  };

  // Process data for charts
  const chartData = validMonths.map((m: any) => {
    const coverage = m.totalEnergyKwh ? (m.totalMarketEnergyKwh || 0) / m.totalEnergyKwh * 100 : 0;
    const netRate = m.totalEnergyKwh ? m.savings / m.totalEnergyKwh : 0;
    const grossRate = m.totalEnergyKwh ? (m.grossSavings || m.savings) / m.totalEnergyKwh : 0;
    
    // For old charts
    const actualDiscom = m.totalEnergyKwh || 0;
    const actualOa = 0;
    const recOa = m.totalMarketEnergyKwh || 0;
    const recDiscom = actualDiscom - recOa;
    
    const optimizedCost = (m.totalEnergyKwh || 0) * 5.5; 
    const actualCost = optimizedCost + (m.savings || 0);

    return {
      monthLabel: m.month,
      monthShort: formatMonthLabel(m.month).split(' ')[0],
      clientSaving: m.savings || 0,
      grossSaving: m.grossSavings || (m.savings || 0),
      coverage: coverage,
      netRate: netRate,
      grossRate: grossRate,
      actualDiscom,
      actualOa,
      recDiscom,
      recOa,
      totalUnits: m.totalEnergyKwh || 0,
      actualCost,
      recCost: optimizedCost
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
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Monthly savings and Open Access coverage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click a month in the matrix below to open its linked sub-report.
            </Typography>
            
            <Box sx={{ flex: 1, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={formatLakhs} />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={(val: number) => `${Number(val).toFixed(2)}%`} 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: string) => [
                      typeof val === 'number' 
                        ? (name === 'Coverage' ? `${Number(val).toFixed(2)}%` : formatLakhs(val)) 
                        : val, 
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar yAxisId="left" dataKey="grossSaving" name="Gross saving" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="clientSaving" name="Client saving" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="coverage" name="Coverage" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>

            <Box 
              sx={{ 
                mt: 2, 
                pt: 1.5, 
                borderTop: '1px solid #f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1 
              }}
            >
              <InfoOutlinedIcon fontSize="small" sx={{ color: '#64748b', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
                <strong>What is Coverage?</strong> Coverage represents the percentage of total monthly electricity consumption met through Open Access procurement (Consumer-bus Open Access Energy ÷ Total Billed Consumption × 100).
              </Typography>
            </Box>
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
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Best client-saving month: {formatMonthLabel(bestMonth?.monthLabel || bestMonth?.month)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatLakhs(bestMonth?.clientSaving)} final saving with {bestMonth?.coverage.toFixed(0)}% OA coverage.
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Strongest price advantage: {formatMonthLabel(strongestSpreadMonth?.monthLabel || strongestSpreadMonth?.month)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  This means this month had the highest gross saving per unit: ₹{strongestSpreadMonth?.grossRate.toFixed(2)}/kWh (before platform/service fees).
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #eab308' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Lowest coverage: {formatMonthLabel(lowestCoverageMonth?.monthLabel || lowestCoverageMonth?.month)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  This means only {lowestCoverageMonth?.coverage.toFixed(0)}% of total consumption was served through OA in this month. Review scheduling, approvals, availability and forecasting constraints.
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
                <XAxis
                  type="number"
                  dataKey="coverage"
                  name="Coverage"
                  domain={[30, 100]}
                  tickFormatter={(val: number) => `${Number(val).toFixed(0)}%`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="grossRate"
                  name="Price spread"
                  domain={['dataMin - 0.2', 'dataMax + 0.2']}
                  tickFormatter={(val: number) => `₹${Number(val).toFixed(2)}`}
                  width={88}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="category" dataKey="monthShort" name="Month" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={renderSpreadTooltip} />
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

      {/* 3. Original Charts: Monthly Consumption Mix & Monthly Spend Comparison */}
      <Grid container spacing={3}>
        {/* Monthly Consumption Mix */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Monthly Consumption Mix - DISCOM vs OA
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Compare your actual energy source mix with Prolt's recommended distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatIndianNumber(v)} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="actualDiscom" name="Actual DISCOM" stackId="actual" fill="#94A3B8" />
                <Bar dataKey="actualOa" name="Actual OA" stackId="actual" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recDiscom" name="Prolt DISCOM" stackId="recommended" fill="#475569" />
                <Bar dataKey="recOa" name="Prolt OA" stackId="recommended" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Monthly Spend Comparison */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', mb: 0.5 }}>
              Monthly Spend Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Compare actual costs versus the estimated optimized costs.
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatLakhs(v)} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="actualCost" name="Actual" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recCost" name="Optimized" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
      
    </Box>
  );
};
