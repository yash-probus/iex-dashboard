import React from 'react';
import { Box, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { MarketOverviewSummary } from '../types/overview';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { MARKET_ITEMS, RESOURCE_CENTER_ITEMS, DATABASE_ITEMS } from '../constants/dashboardOverview';

export default function DashboardPage() {

  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: dashboardApi.getMarketOverview,
  });

  const getMarketData = (key: 'dam' | 'gdam' | 'rtm'): MarketOverviewSummary | null => {
    if (!overview?.data) return null;
    return overview.data[key];
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load market summary.
        </Alert>
      )}

      <OverviewSection 
        title="Market Overview"
        description="Select a market to view detailed analytics, aggregated metrics, and precise interval data."
        type="market"
        items={MARKET_ITEMS}
        isLoading={isLoading}
        getMarketData={getMarketData}
      />

      <OverviewSection 
        title="Database Overview"
        description="Access centralized repositories for nationwide and state-level power demand, plus historical weather data."
        type="database"
        items={DATABASE_ITEMS}
      />

      <OverviewSection 
        title="Resource Center Overview"
        description="Manage master configurations, tariffs, margins, and charge structures."
        type="resource"
        items={RESOURCE_CENTER_ITEMS}
      />
    </Box>
  );
}
