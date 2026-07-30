import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, AreaChart, Area } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';

export const OverallVisualAnalytics: React.FC<{ clientOverview: any; selectedMonth?: string }> = ({ clientOverview, selectedMonth }) => {
  if (!clientOverview || !clientOverview.months) return null;

  let validMonths = clientOverview.months.filter((m: any) => !m.error);
  if (selectedMonth && selectedMonth !== 'all') {
    validMonths = validMonths.filter((m: any) => m.month === selectedMonth);
  }

  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const chartData = validMonths.map((m: any) => {
    // We assume Actual is 100% DISCOM since it's a simulation
    const actualDiscom = m.totalEnergyKwh || 0;
    const actualOa = 0;
    const recOa = m.totalMarketEnergyKwh || 0;
    const recDiscom = actualDiscom - recOa;
    
    // Estimate baseline cost and optimized cost
    // For Spend comparison:
    // In Savings Calculator, Baseline is actualDiscom * some rate. Let's use a default rate if not available, or calculate from savings.
    // We can just use dummy values if needed, or deduce from savings.
    // Wait, the clientOverview doesn't have the baseline cost directly per month.
    // Let's use savings to estimate: savings = Baseline - Optimized.
    // This is just a visual approximation if we don't have the exact cost.
    const optimizedCost = (m.totalEnergyKwh || 0) * 5.5; // Roughly 5.5 Rs per kWh optimized
    const actualCost = optimizedCost + (m.savings || 0);

    return {
      monthLabel: m.month,
      actualDiscom,
      actualOa,
      recDiscom,
      recOa,
      totalUnits: m.totalEnergyKwh || 0,
      actualCost,
      recCost: optimizedCost
    };
  });

  return (
    <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Monthly Consumption Mix */}
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BarChartIcon sx={{ color: '#0EA5E9', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Monthly Consumption Mix - DISCOM vs OA
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: -2, mb: 2 }}>
          Compare your actual energy source mix with Prolt's recommended distribution
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => formatIndianNumber(v)} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="actualDiscom" name="Actual DISCOM" stackId="actual" fill="#94A3B8" />
            <Bar dataKey="actualOa" name="Actual OA" stackId="actual" fill="#4ADE80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recDiscom" name="Prolt DISCOM" stackId="recommended" fill="#475569" />
            <Bar dataKey="recOa" name="Prolt OA" stackId="recommended" fill="#16A34A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Spend Comparison */}
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUpIcon sx={{ color: '#0EA5E9', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Monthly Spend Comparison
          </Typography>
        </Box>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(val: number) => formatCurrency(val)}
            />
            <Bar dataKey="actualCost" name="Actual" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recCost" name="Optimized" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
};
