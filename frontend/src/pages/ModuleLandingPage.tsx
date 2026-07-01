import React from 'react';
import { Box, Alert, Typography, IconButton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.api';
import { MarketOverviewSummary } from '../types/overview';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { 
  MARKET_ITEMS, 
  RESOURCE_CENTER_ITEMS, 
  DATABASE_ITEMS,
  OverviewItemType 
} from '../constants/dashboardOverview';

interface ModuleLandingPageProps {
  type: OverviewItemType;
}

export default function ModuleLandingPage({ type }: ModuleLandingPageProps) {
  const navigate = useNavigate();

  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: dashboardApi.getMarketOverview,
    enabled: type === 'market',
  });

  const getMarketData = (key: 'dam' | 'gdam' | 'rtm'): MarketOverviewSummary | null => {
    if (!overview?.data) return null;
    return overview.data[key];
  };

  let title = '';
  let description = '';
  let items = [];

  switch (type) {
    case 'market':
      title = "Market Overview";
      description = "Select a market to view detailed analytics, aggregated metrics, and precise interval data.";
      items = MARKET_ITEMS;
      break;
    case 'database':
      title = "Database Overview";
      description = "Access centralized repositories for nationwide and state-level power demand, plus historical weather data.";
      items = DATABASE_ITEMS;
      break;
    case 'resource':
      title = "Resource Center Overview";
      description = "Manage master configurations, tariffs, margins, and charge structures.";
      items = RESOURCE_CENTER_ITEMS;
      break;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" color="text.secondary">Back to Dashboard</Typography>
      </Box>

      {isError && type === 'market' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load market summary.
        </Alert>
      )}

      <OverviewSection 
        title={title}
        description={description}
        type={type}
        items={items}
        isLoading={isLoading}
        getMarketData={type === 'market' ? getMarketData : undefined}
      />
    </Box>
  );
}
