import React from 'react';
import { Box, Typography, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { TrendingUp, BarChart, ElectricBolt, ShowChart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../contexts/AuthContext';

const GDAM_ACCENT = '#34B1AA'; // Resolved from var(--color-market-gdam) for alpha() support

const chartMetrics: ChartMetric[] = [
  { key: 'purchaseBid', name: 'Purchase Bid', color: '#3B8FF3', type: 'area', yAxisId: 'left' },
  { key: 'sellBidTotal', name: 'Sell Bid', color: '#34B1AA', type: 'area', yAxisId: 'left' },
  { key: 'mcvTotal', name: 'MCV', color: '#F29F67', type: 'area', yAxisId: 'left' },
  { key: 'fsvTotal', name: 'FSV', color: '#8B5CF6', type: 'area', yAxisId: 'left' },
  { key: 'mcp', name: 'MCP', color: '#374151', type: 'line', yAxisId: 'right' },
];

export default function GDAMPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { filters, handleDateChange, handleIntervalChange } = useMarketFilters();
  const { data, summaryMetrics, isLoading, error } = useMarketData('GDAM', filters);
  const [marketView, setMarketView] = React.useState<'all-india' | 'state-wise'>('all-india');

  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [];
    
    // Always include Date
    baseColumns.push({ field: 'date', headerName: 'Date', sticky: true, width: 120, align: 'center' });
    
    if (filters.interval === '15min' || filters.interval === 'hourly') {
      baseColumns.push({ field: 'hour', headerName: 'Hour', sticky: true, width: 100, align: 'center' });
    }
    
    if (filters.interval === '15min') {
      baseColumns.push({ field: 'timeBlock', headerName: 'Block', sticky: true, width: 100, align: 'center' });
    }

    const formatNum = (v: any) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
    const metricColumns: ColumnDefinition[] = [
      { field: 'purchaseBid', headerName: 'Purchase Bid (MW)', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'sellBidTotal', headerName: 'Sell Bid Total (MW)', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'sellBidSolar', headerName: 'Sell Bid Solar', width: 120, align: 'right', valueFormatter: formatNum },
      { field: 'sellBidNonSolar', headerName: 'Sell Bid Non-Solar', width: 140, align: 'right', valueFormatter: formatNum },
      { field: 'sellBidHydro', headerName: 'Sell Bid Hydro', width: 120, align: 'right', valueFormatter: formatNum },
      { field: 'mcvTotal', headerName: 'MCV Total (MW)', width: 120, align: 'right', valueFormatter: formatNum },
      { field: 'mcvSolar', headerName: 'MCV Solar', width: 100, align: 'right', valueFormatter: formatNum },
      { field: 'mcvNonSolar', headerName: 'MCV Non-Solar', width: 120, align: 'right', valueFormatter: formatNum },
      { field: 'mcvHydro', headerName: 'MCV Hydro', width: 100, align: 'right', valueFormatter: formatNum },
      { field: 'fsvTotal', headerName: 'FSV Total (MW)', width: 120, align: 'right', valueFormatter: formatNum },
      { field: 'fsvSolar', headerName: 'FSV Solar', width: 100, align: 'right', valueFormatter: formatNum },
      { field: 'fsvNonSolar', headerName: 'FSV Non-Solar', width: 120, align: 'right', valueFormatter: formatNum },
      { field: 'fsvHydro', headerName: 'FSV Hydro', width: 100, align: 'right', valueFormatter: formatNum },
      { field: 'mcp', headerName: 'MCP (₹/kWh)', width: 120, align: 'right', valueFormatter: (v) => v !== undefined ? `₹${formatNum(v)}` : '-' },
    ];

    return [...baseColumns, ...metricColumns];
  };

  const columns = getColumns();

  const handleExport = () => exportToCSV(data, `GDAM_Data_${filters.date}`, columns);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2.5,
        mb: 1, 
        pb: 3, 
        borderBottom: '1px solid', 
        borderColor: 'divider' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ 
            color: GDAM_ACCENT, 
            backgroundColor: `${GDAM_ACCENT}15`,
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ElectricBolt fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
              Green Day Ahead Market
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Analyze GDAM renewable trends, volumes, and prices.
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={marketView}
          exclusive
          onChange={(e, value) => value && setMarketView(value)}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2.5,
            p: 0.5,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: 2,
              px: 2.5,
              py: 0.75,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: GDAM_ACCENT,
                color: '#FFF',
                '&:hover': {
                  bgcolor: GDAM_ACCENT,
                }
              }
            }
          }}
        >
          <ToggleButton value="all-india">All India</ToggleButton>
          <ToggleButton value="state-wise">State Wise</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {marketView === 'state-wise' ? (
        <EmptyState 
          title="State-wise Data Under Integration" 
          description="State-wise Green Day Ahead Market (GDAM) data is not yet available in the system. We are working on integrating state-level renewable market clearing volumes and prices."
        />
      ) : error ? (
        <EmptyState 
          title="No Market Data Found" 
          description={error}
        />
      ) : (
        <>
          <SummaryGrid>
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Average MCP" value={`₹ ${Number(summaryMetrics.averageMcp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<TrendingUp fontSize="small" />} accentColor={GDAM_ACCENT} />}
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Total Volume" value={`${Number(summaryMetrics.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`} icon={<BarChart fontSize="small" />} accentColor={GDAM_ACCENT} />}
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Max MCV" value={`${Number(summaryMetrics.maxMcv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`} icon={<ElectricBolt fontSize="small" />} accentColor={GDAM_ACCENT} />}
            {isLoading ? <SummaryCardSkeleton /> : <SummaryCard title="Max FSV" value={`${Number(summaryMetrics.maxFsv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`} icon={<ShowChart fontSize="small" />} accentColor={GDAM_ACCENT} />}
          </SummaryGrid>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <MarketChart 
              title="GDAM Market Overview" 
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
              title="GDAM Interval Data" 
              data={data}
              columns={columns}
              onExport={handleExport}
            />
          )}
        </>
      )}

      {marketView === 'all-india' && (
        <FilterContainer 
          accentColor={GDAM_ACCENT} 
          filters={filters}
          onDateChange={handleDateChange}
          onIntervalChange={handleIntervalChange}
          onExport={handleExport}
          onManageData={isAuthenticated ? () => navigate('/admin/market-data') : undefined}
          hideHourlyDaily={true}
        />
      )}
    </Box>
  );
}
