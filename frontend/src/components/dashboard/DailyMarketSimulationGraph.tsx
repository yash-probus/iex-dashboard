import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface SlotData {
  date: string; // YYYY-MM-DD format
  marketSource: string;
  shouldBuyFromMarket: boolean;
  marketEnergy?: number;
  discomEnergy?: number;
}

interface DailyMarketSimulationGraphProps {
  slotsData: SlotData[];
}

export const DailyMarketSimulationGraph: React.FC<DailyMarketSimulationGraphProps> = ({ slotsData }) => {
  const chartData = useMemo(() => {
    if (!slotsData || slotsData.length === 0) return [];

    const dailyData: Record<string, { date: string; DAM: number; GDAM: number; RTM: number; DISCOM: number }> = {};

    slotsData.forEach((slot) => {
      if (!dailyData[slot.date]) {
        dailyData[slot.date] = { date: slot.date, DAM: 0, GDAM: 0, RTM: 0, DISCOM: 0 };
      }

      if (slot.shouldBuyFromMarket) {
        if (slot.marketSource === 'DAM') dailyData[slot.date].DAM += (slot.marketEnergy || 0);
        else if (slot.marketSource === 'GDAM') dailyData[slot.date].GDAM += (slot.marketEnergy || 0);
        else if (slot.marketSource === 'RTM') dailyData[slot.date].RTM += (slot.marketEnergy || 0);
      } else {
        // If not buying from market, the energy is accounted for in discomEnergy
        dailyData[slot.date].DISCOM += (slot.discomEnergy || 0);
      }
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [slotsData]);

  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">No data available to display graph.</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Daily Energy Procurement Source (kWh)
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(val) => {
                const date = new Date(val);
                return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              }}
              formatter={(value: number, name: string) => [value.toFixed(2) + ' kWh', name]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {/* Stacked Bars */}
            <Bar dataKey="DISCOM" stackId="a" fill="#94a3b8" name="DISCOM" />
            <Bar dataKey="DAM" stackId="a" fill="#3b82f6" name="DAM" />
            <Bar dataKey="GDAM" stackId="a" fill="#10b981" name="GDAM" />
            <Bar dataKey="RTM" stackId="a" fill="#8b5cf6" name="RTM" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
