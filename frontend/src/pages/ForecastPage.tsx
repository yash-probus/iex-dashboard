import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Paper, Grid, ToggleButton, ToggleButtonGroup, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer as MuiTableContainer, TableRow, TableHead } from '@mui/material';
import {
  Timeline as TimelineIcon,
  FileDownload as DownloadIcon,
  TrendingUp,
  BarChart,
  ElectricBolt,
  ShowChart,
  Construction as ConstructionIcon,
  TrendingDown
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import DateRangePicker from '../components/common/DateRangePicker';
import ActionButton from '../components/common/ActionButton';
import SummaryGrid from '../components/dashboard/SummaryGrid';
import SummaryCard from '../components/dashboard/SummaryCard';
import MarketChart, { ChartMetric } from '../components/dashboard/MarketChart';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import { SummaryCardSkeleton, ChartSkeleton, TableSkeleton } from '../components/dashboard/Skeletons';
import EmptyState from '../components/dashboard/EmptyState';
import { apiClient } from '../api/client';
import { exportToCSV } from '../utils/export';

export default function ForecastPage() {
  const location = useLocation();
  const path = location.pathname;

  // Determine forecast type and market/sub-type from path
  const isPrice = path.includes('/forecast/price');
  const isDemand = path.includes('/forecast/demand');

  let subType = 'dam'; // default
  let displayTitle = '';
  let displaySubtitle = '';
  let accentColor = '#8B5CF6'; // purple for price

  if (isPrice) {
    if (path.endsWith('/rtm')) subType = 'rtm';
    else if (path.endsWith('/gdam')) subType = 'gdam';
    else subType = 'dam';

    displayTitle = `${subType.toUpperCase()} Forecast`;
    displaySubtitle = `Forecasted market clearing prices (MCP) and volumes for the Day-Ahead and Real-Time markets.`;
    accentColor = '#8B5CF6';
  } else if (isDemand) {
    if (path.endsWith('/all-india')) subType = 'all-india';
    else subType = 'consumer';

    displayTitle = `${subType === 'all-india' ? 'All India' : 'Consumer'} Demand Forecast`;
    displaySubtitle = `Forecasted electricity load curves and demand profiles for utility planning and analysis.`;
    accentColor = '#00BFA5'; // teal for demand
  }

  // Set default dates: today to tomorrow
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getDaysAheadStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState({
    startDate: getTodayStr(),
    endDate: getTodayStr(),
    interval: '15min' as '15min' | 'hourly' | 'daily',
    model: 'Model1' as 'Model1' | 'Model2'
  });

  // Local filter states
  const [localStartDate, setLocalStartDate] = useState(filters.startDate);
  const [localEndDate, setLocalEndDate] = useState(filters.endDate);
  const [localInterval, setLocalInterval] = useState<'15min' | 'hourly' | 'daily'>(filters.interval);
  const [localModel, setLocalModel] = useState<'Model1' | 'Model2'>(filters.model);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available dates from database
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await apiClient.get(`/forecast/dates?market=${subType}`);
        if (res.data && res.data.success) {
          const dates = res.data.data || [];
          setAvailableDates(dates);
          if (dates.length > 0) {
            // Default both startDate and endDate to the latest available forecast date
            setFilters(prev => ({
              ...prev,
              startDate: dates[0],
              endDate: dates[0]
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch available dates:', err);
      }
    };

    if (isPrice && subType === 'dam') {
      fetchDates();
    }
  }, [subType, isPrice]);

  // Sync local filter states with filters when filters change
  useEffect(() => {
    setLocalStartDate(filters.startDate);
    setLocalEndDate(filters.endDate);
    setLocalInterval(filters.interval);
    setLocalModel(filters.model);
  }, [filters]);

  // Fetch forecast data
  const fetchForecast = async () => {
    if (isDemand) return; // Skip fetching if demand is under progress

    setIsLoading(true);
    setError(null);
    try {
      const endpoint = `/forecast/price?market=${subType}&startDate=${filters.startDate}&endDate=${filters.endDate}&interval=${filters.interval}&model=${filters.model}`;
      const res = await apiClient.get(endpoint);
      if (res.data && res.data.success) {
        setData(res.data.data.intervals || []);
        setSummaryMetrics(res.data.data.analytics || {});
      } else {
        setError('Invalid response from server.');
      }
    } catch (err: any) {
      console.error('[ForecastPage] Error fetching forecast data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to connect to forecast service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [isPrice, subType, filters.startDate, filters.endDate, filters.interval, filters.model]);

  // Define columns for table
  const getColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [
      { field: 'date', headerName: 'Date', sticky: true, align: 'center' },
    ];

    if (filters.interval === '15min' || filters.interval === 'hourly') {
      baseColumns.push({ field: 'hour', headerName: 'Hour', sticky: true, align: 'center' });
    }

    if (filters.interval === '15min') {
      baseColumns.push({ field: 'timeBlock', headerName: 'Time Block', sticky: true, align: 'center' });
    }

    return [
      ...baseColumns,
      { field: 'mcp', headerName: 'MCP (₹/kWh)', align: 'center', valueFormatter: (v: any) => typeof v === 'number' ? `₹${v.toFixed(2)}` : v },
    ];
  };

  const columns = getColumns();

  // Define chart metrics
  const getChartMetrics = (): ChartMetric[] => {
    return [
      {key: 'mcp', name: 'MCP (₹/kWh)', color: accentColor, type: 'area', yAxisId: 'right'},
    ];
  };

  const chartMetrics = getChartMetrics();

  const handleExport = () => {
    exportToCSV(data, `${subType.toUpperCase()}_Forecast_${filters.startDate}_to_${filters.endDate}`, columns);
  };

  const handleSearch = (newFilters: any) => {
    setFilters({
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      interval: newFilters.interval,
      model: newFilters.model
    });
  };

  // If submodule is Demand Forecast, RTM, or GDAM, render the Build In Progress placeholder
  if (isDemand || subType === 'rtm' || subType === 'gdam') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Title Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 0.5,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              color: accentColor,
              backgroundColor: `${accentColor}15`,
              p: 1.25,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TimelineIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
                {displayTitle}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {displaySubtitle}
              </Typography>
            </Box>
          </Box>
        </Box>

        <EmptyState
          icon={<ConstructionIcon sx={{ fontSize: 60, color: 'text.secondary' }} />}
          title="Module Build In Progress"
          description={
            isDemand
              ? `The Demand Forecasting engine for ${subType === 'all-india' ? 'All India grid' : 'Consumer load profiling'} is currently under active development. Real-time machine learning predictions will be available here soon.`
              : `The Price Forecasting engine for ${subType.toUpperCase()} is currently under active development. Real-time machine learning predictions will be available here soon.`
          }
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Title Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        mb: 0.5,
        pb: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            color: accentColor,
            backgroundColor: `${accentColor}15`,
            p: 1.25,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TimelineIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
              {displayTitle}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {displaySubtitle}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ActionButton
            variant="secondary"
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={handleExport}
            accentColor={accentColor}
            disabled={isLoading || data.length === 0}
          >
            Export Forecast
          </ActionButton>
        </Box>
      </Box>

      {/* Expanded Thin Filter Container */}
      <Box
        sx={{
          py: 1.25,
          px: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          borderRadius: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {availableDates.length > 0 ? (
              <TextField
                select
                label="Forecast Date"
                value={localStartDate}
                onChange={(e) => {
                  setLocalStartDate(e.target.value);
                  setLocalEndDate(e.target.value);
                }}
                size="small"
                sx={{
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                  }
                }}
              >
                {availableDates.map((d) => (
                  <MenuItem key={d} value={d}>
                    {new Date(d).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                type="date"
                label="Forecast Date"
                value={localStartDate}
                onChange={(e) => {
                  setLocalStartDate(e.target.value);
                  setLocalEndDate(e.target.value);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                  }
                }}
              />
            )}

            <TextField
              select
              label="Model"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value as 'Model1' | 'Model2')}
              size="small"
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                }
              }}
            >
              <MenuItem value="Model1">Model 1</MenuItem>
              <MenuItem value="Model2">Model 2</MenuItem>
            </TextField>

            <TextField
              select
              label="Interval"
              value={localInterval}
              onChange={(e) => setLocalInterval(e.target.value as '15min' | 'hourly' | 'daily')}
              size="small"
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                }
              }}
            >
              <MenuItem value="15min">15 Min</MenuItem>
              <MenuItem value="hourly">Hourly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
            </TextField>
          </Box>

          <Button
            variant="contained"
            disableElevation
            onClick={() => handleSearch({ startDate: localStartDate, endDate: localEndDate, interval: localInterval, model: localModel })}
            sx={{
              bgcolor: accentColor,
              '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)' },
              textTransform: 'none',
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: 600
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>

      {error ? (
        <EmptyState
          title="Unable to load forecast data"
          description={error}
        />
      ) : (
        <>
          {/* Summary Cards */}
          <SummaryGrid>
            {isLoading ? <SummaryCardSkeleton /> : (
              <SummaryCard
                title="Average Forecasted MCP"
                value={`₹ ${Number(summaryMetrics.averageMcp || 0).toFixed(2)}`}
                icon={<TrendingUp fontSize="small" />}
                accentColor={accentColor}
                sx={{ p: 2 }}
              />
            )}
            {isLoading ? <SummaryCardSkeleton /> : (
              <SummaryCard
                title="Peak Forecasted MCP"
                value={`₹ ${Number(summaryMetrics.maxMcp || 0).toFixed(2)}`}
                icon={<ShowChart fontSize="small" />}
                accentColor={accentColor}
                sx={{ p: 2 }}
              />
            )}
            {isLoading ? <SummaryCardSkeleton /> : (
              <SummaryCard
                title="Minimum Forecasted MCP"
                value={`₹ ${Number(summaryMetrics.minMcp || 0).toFixed(2)}`}
                icon={<TrendingDown fontSize="small" />}
                accentColor={accentColor}
                sx={{ p: 2 }}
              />
            )}
          </SummaryGrid>

          {isLoading ? (
            <>
              <ChartSkeleton />
              <Box sx={{ mt: 3 }}>
                <TableSkeleton />
              </Box>
            </>
          ) : (
            <>
              <MarketChart
                title={`${displayTitle} - Graph View`}
                data={data}
                metrics={chartMetrics}
                dateRangeLabel={filters.startDate === filters.endDate ? filters.startDate : `${filters.startDate} to ${filters.endDate}`}
                interval={filters.interval}
                height={360}
              />

              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      {displayTitle} - Tabular View
                    </Typography>
                  </Box>

                  <MuiTableContainer sx={{ maxHeight: 400, backgroundColor: 'background.paper', overflowY: 'auto' }}>
                    <Table stickyHeader size="small" sx={{ width: '100%' }}>
                      <TableHead>
                        <TableRow>
                          {columns.map(col => (
                            <TableCell
                              key={col.field}
                              align={col.align || "center"}
                              sx={{
                                fontWeight: 600,
                                color: '#1E293B',
                                backgroundColor: '#F8FAFC',
                                borderBottom: '2px solid',
                                borderColor: 'divider',
                                fontSize: '11px',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                width: col.width,
                                minWidth: col.minWidth,
                                position: 'sticky',
                                top: 0,
                                zIndex: 30
                              }}
                            >
                              {col.headerName}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={columns.length} align="center">
                              <Typography variant="body2" color="text.secondary">No records found.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.map((row, index) => (
                            <TableRow
                              key={index}
                              hover
                              sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.01)' }
                              }}
                            >
                              {columns.map(col => {
                                const value = row[col.field];
                                const displayValue = col.valueFormatter ? col.valueFormatter(value) : value;
                                return (
                                  <TableCell
                                    key={col.field}
                                    align={col.align || "center"}
                                    sx={{
                                      fontSize: '12px',
                                      color: 'text.primary',
                                      whiteSpace: 'nowrap',
                                      py: 0.75
                                    }}
                                  >
                                    {displayValue !== undefined && displayValue !== null ? displayValue : '-'}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </MuiTableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Showing {data.length} intervals.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
