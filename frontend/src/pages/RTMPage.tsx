import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { TrendingUp, BarChart, ElectricBolt, ShowChart, Timer as TimerIcon } from '@mui/icons-material';
import FilterContainer from '../components/dashboard/FilterContainer';
import SummaryGrid from '../components/dashboard/SummaryGrid';
import SummaryCard from '../components/dashboard/SummaryCard';
import MarketChart, { ChartMetric } from '../components/dashboard/MarketChart';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import { SummaryCardSkeleton, ChartSkeleton, TableSkeleton } from '../components/dashboard/Skeletons';
import EmptyState from '../components/dashboard/EmptyState';
import { useMarketFilters } from '../hooks/useMarketFilters';
import { useMarketData } from '../hooks/useMarketData';
import { exportToCSV } from '../utils/export';

const RTM_ACCENT = '#E0B50F'; // Resolved from var(--color-market-rtm) for alpha() support

const chartMetrics: ChartMetric[] = [
  { key: 'purchaseBid', name: 'Purchase Bid', color: '#3B8FF3', type: 'area', yAxisId: 'left' },
  { key: 'sellBid', name: 'Sell Bid', color: '#F29F67', type: 'area', yAxisId: 'left' },
  { key: 'mcv', name: 'MCV', color: '#34B1AA', type: 'area', yAxisId: 'left' },
  { key: 'fsv', name: 'FSV', color: '#8B5CF6', type: 'area', yAxisId: 'left' },
  { key: 'mcp', name: 'MCP', color: '#1E1E2C', type: 'line', yAxisId: 'right' },
];

export default function RTMPage() {
  const { filters, handleDateChange, handleIntervalChange } = useMarketFilters();
  const { data, summaryMetrics, isLoading, error } = useMarketData('RTM', filters);

  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [];
    
    // Always include Date
    baseColumns.push({ field: 'date', headerName: 'Date', sticky: true, width: 120, align: 'center' });
    
    if (filters.interval === '15min' || filters.interval === 'hourly') {
      baseColumns.push({ field: 'hour', headerName: 'Hour', sticky: true, width: 100, align: 'center' });
    }
    
    if (filters.interval === '15min') {
      baseColumns.push({ field: 'timeBlock', headerName: 'Block', sticky: true, width: 100, align: 'center' });
      baseColumns.push({ field: 'sessionId', headerName: 'Session ID', sticky: true, width: 100, align: 'center' });
    }

    const formatNum = (v: any) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
    const metricColumns: ColumnDefinition[] = [
      { field: 'purchaseBid', headerName: 'Purchase Bid (MW)', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'sellBid', headerName: 'Sell Bid (MW)', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'mcv', headerName: 'MCV (MW)', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'fsv', headerName: 'FSV (MW)', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'mcp', headerName: 'MCP (₹/kWh)', width: 140, align: 'right', valueFormatter: (v) => v !== undefined ? `₹${formatNum(v)}` : '-' },
    ];

    return [...baseColumns, ...metricColumns];
  };

  const columns = getColumns();

  const handleExport = () => exportToCSV(data, `RTM_Data_${filters.date}`, columns);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2.5,
        mb: 1, 
        pb: 3, 
        borderBottom: '1px solid', 
        borderColor: 'divider' 
      }}>
        <Box sx={{ 
          color: RTM_ACCENT, 
          backgroundColor: `${RTM_ACCENT}15`,
          p: 2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <TimerIcon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
            Real Time Market
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Analyze RTM market trends, volumes, and prices.
          </Typography>
        </Box>
      </Box>

      <FilterContainer 
        accentColor={RTM_ACCENT} 
        filters={filters}
        onDateChange={handleDateChange}
        onIntervalChange={handleIntervalChange}
        onExport={handleExport}
      />

      {error ? (
        <EmptyState 
          title="No Market Data Found" 
          description={error}
        />
      ) : (
        <>
          <SummaryGrid>
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Average MCP" value={`₹ ${Number(summaryMetrics.averageMcp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<TrendingUp fontSize="small" />} accentColor={RTM_ACCENT} />}
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Total Volume" value={`${Number(summaryMetrics.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`} icon={<BarChart fontSize="small" />} accentColor={RTM_ACCENT} />}
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Max MCV" value={`${Number(summaryMetrics.maxMcv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`} icon={<ElectricBolt fontSize="small" />} accentColor={RTM_ACCENT} />}
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Max FSV" value={`${Number(summaryMetrics.maxFsv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`} icon={<ShowChart fontSize="small" />} accentColor={RTM_ACCENT} />}
          </SummaryGrid>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <MarketChart 
              title="RTM Market Overview" 
              data={data}
              metrics={chartMetrics}
              dateRangeLabel={filters.date}
              interval={filters.interval}
            />
          )}

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <TableContainer 
              title="RTM Interval Data" 
              data={data}
              columns={columns}
              onExport={handleExport}
            />
          )}
        </>
      )}
    </Box>
  );
}
