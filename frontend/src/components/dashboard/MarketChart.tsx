import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton, Button } from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export interface ChartMetric {
  key: string;
  name: string;
  color: string;
  type: 'area' | 'line';
  yAxisId: 'left' | 'right';
}

interface MarketChartProps {
  title: string;
  data: any[];
  metrics: ChartMetric[];
  dateRangeLabel: string;
  interval?: string;
}

export default function MarketChart({ title, data, metrics, dateRangeLabel, interval = '15min' }: MarketChartProps) {
  // State to handle toggling metric visibility
  const [hiddenMetrics, setHiddenMetrics] = useState<Record<string, boolean>>({});

  const handleLegendClick = (e: any) => {
    const key = e.dataKey;
    setHiddenMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Format X-Axis dynamically. If data is hourly/daily/etc it will just print the string.
  const formatXAxis = (tickItem: any) => {
    if (!tickItem) return '';
    // If it's a raw number, it's a timeblock. Let's just return it.
    if (typeof tickItem === 'number') return `Blk ${tickItem}`;
    // If it's a string like "2026-06-19-12" (hourly), format it
    if (typeof tickItem === 'string' && tickItem.includes('-')) {
      const parts = tickItem.split('-');
      if (parts.length === 4) return `${parts[3]}:00`; // Return the hour
      if (parts.length === 3) return `${parts[1]}/${parts[2]}`; // MM/DD
      return tickItem;
    }
    return tickItem;
  };

  const getXAxisKey = () => {
    if (data.length > 0) {
      if ('timeBlock' in data[0] && data[0].timeBlock > 0) return 'timeBlock';
      if ('hour' in data[0] && data[0].hour > 0) return 'hour'; // Need a better compound key, we'll use a derived 'label' below
    }
    return 'label';
  };

  // Derive a generic label for the X axis
  let chartData = data.map(d => {
    let label = d.date;
    if (d.hour && d.timeBlock) label = d.timeBlock;
    else if (d.hour) label = `${d.date}-${d.hour}`;
    return { ...d, label };
  });

  // Daily interval requires oldest first graph sorting
  if (interval === 'daily') {
    chartData = [...chartData].reverse();
  }

  const xAxisKey = getXAxisKey();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        height: 520, // Slightly increased for breathing room
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h2" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px' }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', backgroundColor: 'background.default', px: 1.5, py: 0.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
            <CalendarIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {dateRangeLabel}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
            <XAxis 
              dataKey={xAxisKey} 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} 
              axisLine={{ stroke: '#F0F0F0' }}
              tickLine={false}
              dy={15}
            />
            {/* Left Y Axis for Volume */}
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 11, fill: '#6B7280' }} 
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            {/* Right Y Axis for Price */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 11, fill: '#6B7280' }} 
              axisLine={false}
              tickLine={false}
              dx={10}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px', padding: '12px' }}
              labelStyle={{ color: '#1E1E2C', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid #F0F0F0', paddingBottom: '4px' }}
              itemStyle={{ padding: '3px 0', fontWeight: 600 }}
              formatter={(value: any) => typeof value === 'number' ? Number(value.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : value}
            />
            
            <Legend 
              verticalAlign="top"
              wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingBottom: '20px' }} 
              onClick={handleLegendClick} 
              iconType="circle"
            />

            {metrics.map(metric => {
              if (hiddenMetrics[metric.key]) return null;
              
              if (metric.type === 'area') {
                return (
                  <Area 
                    key={metric.key}
                    yAxisId={metric.yAxisId}
                    type="monotone" 
                    dataKey={metric.key} 
                    name={metric.name}
                    fill={metric.color} 
                    stroke={metric.color} 
                    fillOpacity={0.1}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                );
              }
              return (
                <Line 
                  key={metric.key}
                  yAxisId={metric.yAxisId}
                  type="monotone" 
                  dataKey={metric.key} 
                  name={metric.name}
                  stroke={metric.color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
