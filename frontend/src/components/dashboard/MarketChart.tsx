import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton, Button } from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatTimeblock } from '../../utils/date';

export interface ChartMetric {
  key: string;
  name: string;
  color: string;
  type: 'area' | 'line';
  yAxisId: 'left' | 'right';
}

// Custom Cursor Component for Hover Band
const CustomCursor = (props: any) => {
  const { x, y, width, height, activeLabel } = props;
  if (x === undefined || y === undefined) return null;

  const cursorWidth = 50;
  const cursorX = x - cursorWidth / 2;

  return (
    <g>
      {/* Semi-transparent vertical background column with gradient */}
      <rect
        x={cursorX}
        y={y}
        width={cursorWidth}
        height={height}
        fill="url(#cursor-grad)"
        rx={6}
      />
      {/* Solid vertical line down the center */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + height}
        stroke="#8B5CF6"
        strokeWidth={1.5}
        strokeOpacity={0.4}
        strokeDasharray="3 3"
      />
      
      {/* Active Slot Label Pill at the Top of the Cursor */}
      {activeLabel && (
        <g transform={`translate(${x}, ${y - 14})`}>
          {/* Pill background (dark slate/blue matching tooltips) */}
          <rect
            x={-42}
            y={-10}
            width={84}
            height={20}
            rx={10}
            fill="#1E293B"
            filter="url(#pill-shadow)"
          />
          {/* Pill text */}
          <text
            x={0}
            y={1}
            fill="#FFFFFF"
            fontSize={9.5}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {activeLabel}
          </text>
        </g>
      )}
    </g>
  );
};

// Custom Active Dot Component with Floating Pill Tooltip
const CustomActiveDot = (props: any) => {
  const { cx, cy, stroke, payload, dataKey, value } = props;
  if (cx === undefined || cy === undefined) return null;

  // Safeguard value extraction (extract from payload if value is not direct)
  const rawValue = value !== undefined ? value : (payload && dataKey ? payload[dataKey] : undefined);
  if (rawValue === undefined || rawValue === null) return null;

  const formattedValue = typeof rawValue === 'number' 
    ? `₹${rawValue.toFixed(2)}` 
    : rawValue;

  const textStr = String(formattedValue);
  const pillWidth = Math.max(65, textStr.length * 7.5 + 16);

  return (
    <g>
      {/* Outer pulsing glow */}
      <circle cx={cx} cy={cy} r={12} fill={stroke} fillOpacity={0.25} />
      <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.4} />
      {/* Inner white dot with colored stroke */}
      <circle cx={cx} cy={cy} r={4.5} fill="#FFFFFF" stroke={stroke} strokeWidth={3} />
      
      {/* Floating Tooltip Pill */}
      <g transform={`translate(${cx}, ${cy - 26})`}>
        {/* Pill background */}
        <rect
          x={-pillWidth / 2}
          y={-12}
          width={pillWidth}
          height={22}
          rx={11}
          fill={stroke}
          filter="url(#pill-shadow)"
        />
        {/* Pill text */}
        <text
          x={0}
          y={1}
          fill="#FFFFFF"
          fontSize={10.5}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {formattedValue}
        </text>
      </g>
    </g>
  );
};

interface MarketChartProps {
  title: string;
  data: any[];
  metrics: ChartMetric[];
  dateRangeLabel: string;
  interval?: string;
  height?: number;
}

export default function MarketChart({ title, data, metrics, dateRangeLabel, interval = '15min', height = 540 }: MarketChartProps) {
  // State to handle toggling metric visibility
  const [hiddenMetrics, setHiddenMetrics] = useState<Record<string, boolean>>({});

  // State to track currently hovered/active payload for cursor info
  const [activePayload, setActivePayload] = useState<any>(null);

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setActivePayload(state.activePayload[0].payload);
    } else {
      setActivePayload(null);
    }
  };

  const handleMouseLeave = () => {
    setActivePayload(null);
  };

  const handleLegendClick = (e: any) => {
    const key = e.dataKey;
    setHiddenMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Format X-Axis dynamically. If data is hourly/daily/etc it will just print the string.
  const formatXAxis = (tickItem: any) => {
    if (!tickItem) return '';
    // If it's a raw number, it's a timeblock. Let's just return it using unified formatting.
    if (typeof tickItem === 'number') return formatTimeblock(tickItem);
    // If it's a string like "2026-06-19-12" (hourly), format it
    if (typeof tickItem === 'string' && tickItem.split('-').length === 4) {
      const parts = tickItem.split('-');
      return `${parts[3]}:00`; // Return the hour
    }
    // If it's a date string like "2026-06-19" or "14-01-2026", format as nice date
    if (typeof tickItem === 'string' && tickItem.split('-').length === 3) {
      const parts = tickItem.split('-');
      let d = new Date(tickItem); // Try default parsing first
      
      // If it looks like DD-MM-YYYY (e.g. 14-01-2026)
      if (parts[0].length <= 2 && parts[2].length === 4) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      }
      // If it looks like YYYY-MM-DD (e.g. 2026-01-14)
      else if (parts[0].length === 4 && parts[2].length <= 2) {
        d = new Date(tickItem);
      }

      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return tickItem;
  };

  const getXAxisKey = () => {
    if (interval === 'daily' || interval === 'monthly') return 'label';
    if (data.length > 0) {
      // If it's timeBlock data but passed as strings like "00:00-00:15"
      if (interval === '15min' || interval === 'hourly') return 'label';
    }
    return 'label';
  };

  // Derive a generic label for the X axis
  let chartData = data.map(d => {
    let label = d.date;
    if (interval === '15min') {
      label = d.timeBlock || d.intervalTime || d.date;
    } else if (interval === 'hourly') {
      label = d.hour ? `${d.date}-${d.hour}` : d.date;
    }
    return { ...d, label };
  });

  // Daily interval requires oldest first graph sorting
  if (interval === 'daily') {
    chartData = [...chartData].reverse();
  }

  const xAxisKey = getXAxisKey();
  const hasLeftAxis = metrics.some(m => m.yAxisId === 'left' && !hiddenMetrics[m.key]);
  const hasRightAxis = metrics.some(m => m.yAxisId === 'right' && !hiddenMetrics[m.key]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        height: height,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
          <ComposedChart 
            data={chartData} 
            margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {metrics.map(metric => (
                <linearGradient key={`grad-${metric.key}`} id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0.0}/>
                </linearGradient>
              ))}
              
              {/* Drop Shadow for Tooltip Pills */}
              <filter id="pill-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.2" floodColor="#000000" />
              </filter>

              {/* Gradient for Vertical Cursor Band */}
              <linearGradient id="cursor-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.03} />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
            <XAxis 
              dataKey={xAxisKey} 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} 
              axisLine={{ stroke: '#F0F0F0' }}
              tickLine={false}
              dy={10}
            />
            {/* Left Y Axis for Volume */}
            {hasLeftAxis && (
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11, fill: '#6B7280' }} 
                axisLine={false}
                tickLine={false}
                width={60}
                domain={
                  metrics.some(m => m.yAxisId === 'left' && (m.key.toLowerCase().includes('mcp') || m.key.toLowerCase().includes('price') || m.name.toLowerCase().includes('price')))
                    ? [(dataMin: number) => Math.max(0, Number((dataMin - 0.5).toFixed(2))), (dataMax: number) => Number((dataMax + 0.5).toFixed(2))]
                    : [0, 'auto']
                }
              />
            )}
            {/* Right Y Axis for Price */}
            {hasRightAxis && (
              <YAxis 
                yAxisId="right" 
                orientation={hasLeftAxis ? "right" : "left"}
                tick={{ fontSize: 11, fill: '#6B7280' }} 
                axisLine={false}
                tickLine={false}
                width={55}
                domain={
                  metrics.some(m => m.yAxisId === 'right' && (m.key.toLowerCase().includes('mcp') || m.key.toLowerCase().includes('price') || m.name.toLowerCase().includes('price')))
                    ? [(dataMin: number) => Math.max(0, Number((dataMin - 0.5).toFixed(2))), (dataMax: number) => Number((dataMax + 0.5).toFixed(2))]
                    : [0, 'auto']
                }
              />
            )}
            
            <Tooltip 
              content={() => null}
              cursor={<CustomCursor activeLabel={activePayload?.label} />}
            />
            
            <Legend 
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '16px' }} 
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
                    fill={`url(#grad-${metric.key})`} 
                    stroke={metric.color} 
                    fillOpacity={1}
                    activeDot={<CustomActiveDot />}
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
                  activeDot={<CustomActiveDot />}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
