import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MarketDecisionResult, DemandShiftInsightsResult } from '../../api/savingsCalculator.api';

interface VisualAnalyticsChartsProps {
  marketDecisionResult: MarketDecisionResult;
  demandShiftInsights: DemandShiftInsightsResult;
  maxEnergyPerSlot: number;
}

export const VisualAnalyticsCharts: React.FC<VisualAnalyticsChartsProps> = ({
  marketDecisionResult,
  demandShiftInsights,
  maxEnergyPerSlot,
}) => {
  const theme = useTheme();
  const [sourceView, setSourceView] = useState<'PROLT' | 'INSIGHTS'>('PROLT');

  const { costData, sourceDataProlt, sourceDataInsights } = useMemo(() => {
    const dailyData: Record<string, any> = {};

    // 1. Process Market Decision (PROLT)
    marketDecisionResult.slotsData.forEach((slot) => {
      const day = new Date(slot.date).getDate().toString();
      if (!dailyData[day]) {
        dailyData[day] = {
          day,
          discomCost: 0,
          proltCost: 0,
          insightsCost: 0,
          // For Source Graph PROLT
          proltDiscomEnergy: 0,
          proltDamEnergy: 0,
          proltRtmEnergy: 0,
          proltGdamEnergy: 0,
          // For Source Graph INSIGHTS
          insightsDiscomEnergy: 0,
          insightsDamEnergy: 0,
          insightsRtmEnergy: 0,
          insightsGdamEnergy: 0,
        };
      }

      const energy = maxEnergyPerSlot;
      const discomCostForSlot = slot.discomLanding * energy;
      
      let proltCostForSlot = discomCostForSlot;
      if (slot.shouldBuyFromMarket) {
        proltCostForSlot = slot.bestMarketLanding * energy;
        if (slot.marketSource === 'DAM') dailyData[day].proltDamEnergy += energy;
        else if (slot.marketSource === 'RTM') dailyData[day].proltRtmEnergy += energy;
        else if (slot.marketSource === 'GDAM') dailyData[day].proltGdamEnergy += energy;
      } else {
        dailyData[day].proltDiscomEnergy += energy;
      }

      dailyData[day].discomCost += discomCostForSlot;
      dailyData[day].proltCost += proltCostForSlot;
    });

    // Add daily fixed overheads to PROLT Cost and Insights Cost
    if (marketDecisionResult.oaDetailed) {
      const { dailyFixedOverhead, bidApplicationFees } = marketDecisionResult.oaDetailed;
      const totalOverheadForMonth = dailyFixedOverhead + bidApplicationFees;
      const daysInMonth = Object.keys(dailyData).length || 30;
      const extraDailyCost = totalOverheadForMonth / daysInMonth;
      
      Object.keys(dailyData).forEach(day => {
        dailyData[day].proltCost += extraDailyCost;
        dailyData[day].insightsCost += extraDailyCost;
      });
    }

    // 2. Process Industry Insights
    demandShiftInsights.slotsData.forEach((slot) => {
      const day = new Date(slot.date).getDate().toString();
      if (!dailyData[day]) return; // Should already exist from PROLT

      const cost = slot.costPerKwh * slot.newEnergy;
      dailyData[day].insightsCost += cost;

      if (slot.shouldBuyFromMarket) {
        if (slot.marketSource === 'DAM') dailyData[day].insightsDamEnergy += slot.marketEnergy;
        else if (slot.marketSource === 'RTM') dailyData[day].insightsRtmEnergy += slot.marketEnergy;
        else if (slot.marketSource === 'GDAM') dailyData[day].insightsGdamEnergy += slot.marketEnergy;
      }
      dailyData[day].insightsDiscomEnergy += slot.discomEnergy;
    });

    const finalData = Object.values(dailyData).sort((a, b) => parseInt(a.day) - parseInt(b.day));
    
    return {
      costData: finalData,
      sourceDataProlt: finalData,
      sourceDataInsights: finalData,
    };
  }, [marketDecisionResult, demandShiftInsights, maxEnergyPerSlot]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 3 }}>
      {/* GRAPH 1: Price Comparison */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Daily Cost Comparison (₹)
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={costData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `₹${(val / 1000).toLocaleString('en-IN')}k`}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '']}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar name="Actual DISCOM Cost" dataKey="discomCost" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar name="PROLT Cost" dataKey="proltCost" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              <Bar name="Industry Insights Cost" dataKey="insightsCost" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* GRAPH 2: Source Breakdown */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Energy Purchase Comparison (kWh)
          </Typography>
        </Box>
        
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart 
              data={sourceDataProlt} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `${(val / 1000).toLocaleString('en-IN')}k`}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => [`${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh`, name]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              
              {/* PROLT Bars */}
              <Bar name="PROLT DISCOM" dataKey="proltDiscomEnergy" stackId="prolt" fill="#8B5CF6" radius={[0, 0, 4, 4]} />
              <Bar name="PROLT DAM" dataKey="proltDamEnergy" stackId="prolt" fill="#F59E0B" />
              <Bar name="PROLT RTM" dataKey="proltRtmEnergy" stackId="prolt" fill="#EF4444" />
              <Bar name="PROLT GDAM" dataKey="proltGdamEnergy" stackId="prolt" fill="#10B981" radius={[4, 4, 0, 0]} />

              {/* INSIGHTS Bars (different opacity to distinguish visually) */}
              <Bar name="INSIGHTS DISCOM" dataKey="insightsDiscomEnergy" stackId="insights" fill="#C4B5FD" radius={[0, 0, 4, 4]} />
              <Bar name="INSIGHTS DAM" dataKey="insightsDamEnergy" stackId="insights" fill="#FCD34D" />
              <Bar name="INSIGHTS RTM" dataKey="insightsRtmEnergy" stackId="insights" fill="#FCA5A5" />
              <Bar name="INSIGHTS GDAM" dataKey="insightsGdamEnergy" stackId="insights" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};
