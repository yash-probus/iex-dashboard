import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Alert, Paper, Grid, ToggleButton, ToggleButtonGroup, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer as MuiTableContainer, TableRow, TableHead, Popover, IconButton, InputAdornment, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import {
  Timeline as TimelineIcon,
  FileDownload as DownloadIcon,
  TrendingUp,
  BarChart,
  ElectricBolt,
  ShowChart,
  Construction as ConstructionIcon,
  TrendingDown,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO } from 'date-fns';
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
  const [showWmape, setShowWmape] = useState(true);
  const [rtmForecastType, setRtmForecastType] = useState<'both' | 'dayahead' | 'nowcast'>('both');

  // Popover state for Calendar
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const handleCalendarOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCalendarClose = () => {
    setAnchorEl(null);
  };
  const calendarOpen = Boolean(anchorEl);

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

    fetchDates();
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
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = isDemand
        ? `/forecast/demand?type=${subType}&startDate=${filters.startDate}&endDate=${filters.endDate}&interval=${filters.interval}`
        : `/forecast/price?market=${subType}&startDate=${filters.startDate}&endDate=${filters.endDate}&interval=${filters.interval}&model=${filters.model}`;
        
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

    if (isDemand) {
      if (subType === 'consumer') {
        return [
          ...baseColumns,
          { field: 'demand', headerName: 'Forecasted Apparent Energy', align: 'center' },
          { field: 'actualDemand', headerName: 'Actual Apparent Energy', align: 'center', valueFormatter: (v: any) => v ?? '-' },
        ];
      } else {
        return [
          ...baseColumns,
          { field: 'demand', headerName: 'Forecasted Demand', align: 'center' },
          { field: 'actualDemand', headerName: 'Actual Demand', align: 'center', valueFormatter: (v: any) => v ?? '-' },
        ];
      }
    }

    if (!isDemand && subType.toUpperCase() === 'RTM') {
      const rtmColumns: ColumnDefinition[] = [...baseColumns];
      
      if (rtmForecastType === 'both' || rtmForecastType === 'dayahead') {
        rtmColumns.push({ field: 'mcpDayahead', headerName: 'Dayahead Forecast (₹/kWh)', align: 'center', valueFormatter: (v: any) => typeof v === 'number' ? `₹${v.toFixed(2)}` : (v !== undefined && v !== null ? v : '-') });
      }
      
      if (rtmForecastType === 'both' || rtmForecastType === 'nowcast') {
        rtmColumns.push({ field: 'mcpNowcast', headerName: 'Nowcast Forecast (₹/kWh)', align: 'center', valueFormatter: (v: any) => typeof v === 'number' ? `₹${v.toFixed(2)}` : (v !== undefined && v !== null ? v : '-') });
      }

      rtmColumns.push(
        { field: 'actualMcp', headerName: 'Actual MCP (₹/kWh)', align: 'center', valueFormatter: (v: any) => typeof v === 'number' ? `₹${v.toFixed(2)}` : (v !== undefined && v !== null ? v : '-') },
        { 
          field: 'priceRange', 
          headerName: 'Price Range', 
          align: 'center',
          renderCell: (row: any) => {
            if (rtmForecastType === 'dayahead') return row.priceRangeDayahead || 'N/A';
            if (rtmForecastType === 'nowcast') return row.priceRangeNowcast || 'N/A';
            return row.priceRangeDayahead && row.priceRangeDayahead !== 'N/A' 
              ? row.priceRangeDayahead 
              : (row.priceRangeNowcast || 'N/A');
          }
        },
        { 
          field: 'confidence', 
          headerName: 'Confidence', 
          align: 'center',
          renderCell: (row: any) => {
            if (rtmForecastType === 'dayahead') return row.confidenceDayahead || 'N/A';
            if (rtmForecastType === 'nowcast') return row.confidenceNowcast || 'N/A';
            return row.confidenceDayahead && row.confidenceDayahead !== 'N/A' 
              ? row.confidenceDayahead 
              : (row.confidenceNowcast || 'N/A');
          }
        }
      );
      
      return rtmColumns;
    }

    return [
      ...baseColumns,
      { field: 'mcp', headerName: 'Forecasted MCP (₹/kWh)', align: 'center', valueFormatter: (v: any) => typeof v === 'number' ? `₹${v.toFixed(2)}` : v },
      { field: 'actualMcp', headerName: 'Actual MCP (₹/kWh)', align: 'center', valueFormatter: (v: any) => typeof v === 'number' ? `₹${v.toFixed(2)}` : (v !== undefined && v !== null ? v : '-') },
      { field: 'priceRange', headerName: 'Price Range', align: 'center' },
      { field: 'confidence', headerName: 'Confidence', align: 'center' },
    ];
  };

  const columns = getColumns();

  // Define chart metrics
  const getChartMetrics = (): ChartMetric[] => {
    if (isDemand) {
      return [
        { key: 'demand', name: subType === 'consumer' ? 'Forecasted Apparent Energy' : 'Forecasted Demand', color: accentColor, type: 'area', yAxisId: 'left' },
        { key: 'actualDemand', name: subType === 'consumer' ? 'Actual Apparent Energy' : 'Actual Demand', color: '#3B82F6', type: 'line', yAxisId: 'left' }
      ];
    }

    const metrics: ChartMetric[] = [];
    
    if (subType.toUpperCase() === 'RTM') {
      if (rtmForecastType === 'both' || rtmForecastType === 'dayahead') {
        metrics.push({key: 'mcpDayahead', name: 'Dayahead Forecast (₹/kWh)', color: '#3B82F6', type: 'line', yAxisId: 'right'});
      }
      if (rtmForecastType === 'both' || rtmForecastType === 'nowcast') {
        metrics.push({key: 'mcpNowcast', name: 'Nowcast Forecast (₹/kWh)', color: '#8B5CF6', type: 'line', yAxisId: 'right'});
      }
    } else {
      metrics.push({key: 'mcp', name: 'Forecasted MCP (₹/kWh)', color: accentColor, type: 'area', yAxisId: 'right'});
    }

    metrics.push({
      key: 'actualMcp',
      name: 'Actual MCP (₹/kWh)',
      color: '#10B981', // green for actual
      type: 'line',
      yAxisId: 'right'
    });

    return metrics;
  };

  const chartMetrics = getChartMetrics();

  const displayMetrics = useMemo(() => {
    if (isDemand || subType.toUpperCase() !== 'RTM' || data.length === 0) return summaryMetrics;

    let sumForecast = 0;
    let sumActual = 0;
    let forecastCount = 0;
    let actualCount = 0;
    let minForecast = Infinity;
    let minActual = Infinity;
    let sumAbsErr = 0;
    let sumPctErr = 0;
    let errCount = 0;
    let sumConf = 0;
    let confCount = 0;

    data.forEach(row => {
      let fVal = null;
      if (rtmForecastType === 'nowcast') {
        fVal = row.mcpNowcast;
      } else if (rtmForecastType === 'dayahead') {
        fVal = row.mcpDayahead;
      } else {
        fVal = row.mcpDayahead !== null && row.mcpDayahead !== undefined ? row.mcpDayahead : row.mcpNowcast;
      }

      const mcp = fVal !== null && fVal !== undefined ? Number(fVal) : null;
      const act = row.actualMcp !== null && row.actualMcp !== undefined ? Number(row.actualMcp) : null;

      if (mcp !== null) {
        sumForecast += mcp;
        forecastCount++;
        if (mcp < minForecast) minForecast = mcp;
      }

      let rowConf = row.confidence;
      if (subType.toUpperCase() === 'RTM') {
        if (rtmForecastType === 'dayahead') rowConf = row.confidenceDayahead;
        else if (rtmForecastType === 'nowcast') rowConf = row.confidenceNowcast;
        else rowConf = (row.confidenceDayahead && row.confidenceDayahead !== 'N/A') ? row.confidenceDayahead : row.confidenceNowcast;
      }

      if (rowConf && rowConf !== 'N/A') {
        sumConf += Number(rowConf);
        confCount++;
      }

      if (act !== null) {
        sumActual += act;
        actualCount++;
        if (act < minActual) minActual = act;

        if (mcp !== null) {
          const absErr = Math.abs(act - mcp);
          sumAbsErr += absErr;
          if (act > 0) {
            sumPctErr += (absErr / act);
            errCount++;
          }
        }
      }
    });

    const avgForecast = forecastCount > 0 ? sumForecast / forecastCount : 0;
    const avgActual = actualCount > 0 ? sumActual / actualCount : null;
    const mae = actualCount > 0 ? sumAbsErr / actualCount : null;
    const mape = errCount > 0 ? (sumPctErr / errCount) * 100 : null;
    const wmape = sumActual > 0 ? (sumAbsErr / sumActual) * 100 : null;

    return {
      ...summaryMetrics,
      averageMcpForecasted: parseFloat(avgForecast.toFixed(2)),
      averageMcpActual: avgActual !== null ? parseFloat(avgActual.toFixed(2)) : 'N/A',
      minMcpForecasted: minForecast === Infinity ? 0 : parseFloat(minForecast.toFixed(2)),
      minMcpActual: minActual === Infinity ? null : parseFloat(minActual.toFixed(2)),
      mae: mae !== null ? parseFloat(mae.toFixed(2)) : 'N/A',
      mape: mape !== null ? `${mape.toFixed(2)}%` : 'N/A',
      wmape: wmape !== null ? `${wmape.toFixed(2)}%` : 'N/A',
      confidence: confCount > 0 ? (sumConf / confCount).toFixed(2) : 'N/A',
    };
  }, [data, summaryMetrics, rtmForecastType, isDemand, subType]);

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
            <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={handleCalendarOpen}>
              <TextField
                label="Forecast Date"
                value={localStartDate}
                size="small"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small">
                        <CalendarTodayIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  minWidth: 180,
                  cursor: 'pointer',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    '& input': { cursor: 'pointer' }
                  }
                }}
              />
            </Box>
            <Popover
              open={calendarOpen}
              anchorEl={anchorEl}
              onClose={handleCalendarClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, '& .rdp': { '--rdp-accent-color': accentColor } }}>
                <DayPicker
                  mode="single"
                  required
                  selected={localStartDate ? (localStartDate.split('-')[0].length === 2 ? new Date(localStartDate.split('-').reverse().join('-')) : parseISO(localStartDate)) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const ymd = format(date, 'yyyy-MM-dd');
                      const orig = availableDates.find(d => {
                        const dYmd = d.split('-')[0].length === 2 ? d.split('-').reverse().join('-') : d;
                        return dYmd === ymd;
                      });
                      const val = orig || ymd;
                      setLocalStartDate(val);
                      setLocalEndDate(val);
                      setFilters(prev => ({ ...prev, startDate: val, endDate: val }));
                    }
                    // Always close the calendar whether a new date was selected,
                    // or the same date was unselected (date = undefined)
                    handleCalendarClose();
                  }}
                  modifiers={{
                    available: (date) => availableDates.some(d => {
                      const ymd = d.split('-')[0].length === 2 ? d.split('-').reverse().join('-') : d;
                      return ymd === format(date, 'yyyy-MM-dd');
                    }),
                    unavailable: (date) => !availableDates.some(d => {
                      const ymd = d.split('-')[0].length === 2 ? d.split('-').reverse().join('-') : d;
                      return ymd === format(date, 'yyyy-MM-dd');
                    })
                  }}
                  modifiersStyles={{
                    unavailable: { opacity: 0.3, cursor: 'not-allowed' },
                    available: { fontWeight: 'bold' }
                  }}
                  disabled={(date) => !availableDates.some(d => {
                    const ymd = d.split('-')[0].length === 2 ? d.split('-').reverse().join('-') : d;
                    return ymd === format(date, 'yyyy-MM-dd');
                  })}
                />
              </Box>
            </Popover>

            <TextField
              select
              label="Model"
              value={localModel}
              onChange={(e) => {
                const val = e.target.value as 'Model1' | 'Model2';
                setLocalModel(val);
                setFilters(prev => ({ ...prev, model: val }));
              }}
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
              onChange={(e) => {
                const val = e.target.value as '15min' | 'hourly' | 'daily';
                setLocalInterval(val);
                setFilters(prev => ({ ...prev, interval: val }));
              }}
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
          {/* Summary Cards */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%', mb: 3 }}>
            {/* Average / Min / Max Cards */}
            {isDemand ? (
              <>
                <Box sx={{ flex: '1 1 200px', minWidth: 190 }}>
                  {isLoading ? <SummaryCardSkeleton /> : (
                    <SummaryCard
                      title={subType === 'consumer' ? "Average Apparent Energy" : "Average Demand"}
                      value={displayMetrics.averageDemand ? `${displayMetrics.averageDemand.toLocaleString('en-IN')} ${subType === 'consumer' ? 'kVA' : 'MW'}` : 'N/A'}
                      icon={<TrendingUp fontSize="small" />}
                      accentColor={accentColor}
                      sx={{ p: 1.75 }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: 190 }}>
                  {isLoading ? <SummaryCardSkeleton /> : (
                    <SummaryCard
                      title={subType === 'consumer' ? "Minimum Apparent Energy" : "Minimum Demand"}
                      value={displayMetrics.minDemand ? `${displayMetrics.minDemand.toLocaleString('en-IN')} ${subType === 'consumer' ? 'kVA' : 'MW'}` : 'N/A'}
                      icon={<TrendingDown fontSize="small" />}
                      accentColor={accentColor}
                      sx={{ p: 1.75 }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: 190 }}>
                  {isLoading ? <SummaryCardSkeleton /> : (
                    <SummaryCard
                      title={subType === 'consumer' ? "Maximum Apparent Energy" : "Maximum Demand"}
                      value={displayMetrics.maxDemand ? `${displayMetrics.maxDemand.toLocaleString('en-IN')} ${subType === 'consumer' ? 'kVA' : 'MW'}` : 'N/A'}
                      icon={<TrendingUp fontSize="small" />}
                      accentColor={accentColor}
                      sx={{ p: 1.75 }}
                    />
                  )}
                </Box>
              </>
            ) : (
              <>
                {/* Average Card */}
                <Box sx={{ flex: '1 1 200px', minWidth: 190 }}>
                  {isLoading ? <SummaryCardSkeleton /> : (
                    <SummaryCard
                      title="Average MCP"
                      value={
                        <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 0.5 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', lineHeight: 1 }}>Forecasted</Typography>
                            <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.1 }}>
                              ₹{Number(displayMetrics.averageMcpForecasted || displayMetrics.averageMcp || 0).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', lineHeight: 1 }}>Actual</Typography>
                            <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.1 }}>
                              {displayMetrics.averageMcpActual === 'N/A' || displayMetrics.averageMcpActual === undefined || displayMetrics.averageMcpActual === null
                                ? 'N/A'
                                : `₹${Number(displayMetrics.averageMcpActual).toFixed(2)}`}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      icon={<TrendingUp fontSize="small" />}
                      accentColor={accentColor}
                      sx={{ p: 1.75 }}
                    />
                  )}
                </Box>

                {/* Minimum Card */}
                <Box sx={{ flex: '1 1 200px', minWidth: 190 }}>
                  {isLoading ? <SummaryCardSkeleton /> : (
                    <SummaryCard
                      title="Minimum MCP"
                      value={
                        <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 0.5 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', lineHeight: 1 }}>Forecasted</Typography>
                            <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.1 }}>
                              ₹{Number(displayMetrics.minMcpForecasted || displayMetrics.minMcp || 0).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', lineHeight: 1 }}>Actual</Typography>
                            <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.1 }}>
                              {displayMetrics.minMcpActual === 'N/A' || displayMetrics.minMcpActual === undefined || displayMetrics.minMcpActual === null
                                ? 'N/A'
                                : `₹${Number(displayMetrics.minMcpActual).toFixed(2)}`}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      icon={<TrendingDown fontSize="small" />}
                      accentColor={accentColor}
                      sx={{ p: 1.75 }}
                    />
                  )}
                </Box>
              </>
            )}

            {/* MAE Card */}
            <Box sx={{ flex: '1 1 120px', minWidth: 115 }}>
              {isLoading ? <SummaryCardSkeleton /> : (
                <SummaryCard
                  title="MAE"
                  value={displayMetrics.mae !== undefined && displayMetrics.mae !== null && displayMetrics.mae !== 'N/A' 
                    ? (isDemand ? Number(displayMetrics.mae).toFixed(2) : `₹${Number(displayMetrics.mae).toFixed(2)}`) 
                    : 'N/A'}
                  icon={<ShowChart fontSize="small" />}
                  accentColor="#EF4444"
                  sx={{ p: 1.75 }}
                />
              )}
            </Box>

            {/* WMAPE Card */}
            <Box sx={{ flex: '1 1 120px', minWidth: 115 }}>
              {isLoading ? <SummaryCardSkeleton /> : (
                <SummaryCard
                  title="WMAPE"
                  value={displayMetrics.wmape || 'N/A'}
                  icon={<ShowChart fontSize="small" />}
                  accentColor="#3B82F6"
                  sx={{ p: 1.75 }}
                />
              )}
            </Box>

            {/* Confidence Card (Price Only) */}
            {!isDemand && (
              <Box sx={{ flex: '1 1 120px', minWidth: 115 }}>
                {isLoading ? <SummaryCardSkeleton /> : (
                  <SummaryCard
                    title="Confidence"
                    value={displayMetrics.confidence || 'N/A'}
                    icon={<ShowChart fontSize="small" />}
                    accentColor="#8B5CF6"
                    sx={{ p: 1.75 }}
                  />
                )}
              </Box>
            )}
          </Box>

          {isLoading ? (
            <>
              <ChartSkeleton />
              <Box sx={{ mt: 3 }}>
                <TableSkeleton />
              </Box>
            </>
          ) : (
            <>
              {!isDemand && subType.toUpperCase() === 'RTM' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <RadioGroup
                    row
                    value={rtmForecastType}
                    onChange={(e) => setRtmForecastType(e.target.value as any)}
                  >
                    <FormControlLabel value="both" control={<Radio size="small" />} label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Both Forecasts</Typography>
                    } />
                    <FormControlLabel value="dayahead" control={<Radio size="small" />} label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Dayahead Only</Typography>
                    } />
                    <FormControlLabel value="nowcast" control={<Radio size="small" />} label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Nowcast Only</Typography>
                    } />
                  </RadioGroup>
                </Box>
              )}
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
                                    {col.renderCell
                                      ? col.renderCell(row)
                                      : (displayValue !== undefined && displayValue !== null ? displayValue : '-')}
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
