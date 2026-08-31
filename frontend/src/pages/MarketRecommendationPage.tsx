import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  CircularProgress, 
  Alert,
  Tooltip
} from '@mui/material';
import { 
  PriceCheck as PriceCheckIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import DateRangePicker from '../components/common/DateRangePicker';
import ActionButton from '../components/common/ActionButton';
import apiClient from '../api/apiClient';
import './MarketRecommendationPage.css';

interface HistoryRecord {
  date: string;
  dam: number | null;
  rtm: number | null;
  gdam: number | null;
}

interface SlotData {
  tod: string;
  season: string;
  prediction: string;
  savings: number;
  history: HistoryRecord[];
  dam_mean: number;
  rtm_mean: number;
  gdam_mean: number;
}

interface DayResult {
  date: string;
  slots: SlotData[];
}

export default function MarketRecommendationPage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getDaysAheadStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const tomorrowStr = getDaysAheadStr(1);
  const endForecastStr = getDaysAheadStr(7);

  // States
  const [startDate, setStartDate] = useState<string>(tomorrowStr);
  const [endDate, setEndDate] = useState<string>(tomorrowStr);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DayResult[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const fetchPredictions = async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/forecast/market-selection?startDate=${start}&endDate=${end}`);
      if (response.data && response.data.success && response.data.data.results) {
        const data = response.data.data.results;
        if (data.length === 0) {
          throw new Error('No forecasting data returned for the selected date range.');
        }
        setResults(data);
        setCurrentPageIndex(0);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch predictions from server.');
      }
    } catch (err: any) {
      console.error('[MarketRecommendationPage] Fetch error:', err);
      setError(err.message || 'Failed to load market recommendation data. Please ensure backend services are running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchPredictions(tomorrowStr, tomorrowStr);
  }, []);

  const handleSearch = () => {
    fetchPredictions(startDate, endDate);
  };

  const handlePrevDay = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleNextDay = () => {
    if (currentPageIndex < results.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  // Format YYYY-MM-DD to DD-MM-YYYY (Day)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[dateObj.getDay()];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]} (${dayName})`;
  };

  // Calculations for current day's summary
  const currentDayData = results[currentPageIndex];
  
  const summary = React.useMemo(() => {
    if (!currentDayData) return null;

    const todSlots = currentDayData.slots.filter(s => s.tod.startsWith('TOD'));
    const marketSavings: Record<string, number> = { 'DAM': 0, 'RTM': 0, 'GDAM': 0 };
    let totalDailySavings = 0;

    todSlots.forEach(slot => {
      if (marketSavings[slot.prediction] !== undefined) {
        marketSavings[slot.prediction] += slot.savings;
      }
      totalDailySavings += slot.savings;
    });

    let bestMarket = 'DAM';
    let maxMarketSavings = -1;
    for (const m in marketSavings) {
      if (marketSavings[m] > maxMarketSavings) {
        maxMarketSavings = marketSavings[m];
        bestMarket = m;
      }
    }

    // Confidence heuristic
    let confidence = 35 + (totalDailySavings / 1000) * 55;
    if (confidence > 98.5) confidence = 98.5;
    if (confidence < 35) confidence = 35;

    let confText = 'Low';
    let confColor = '#ef4444'; // Red
    if (confidence > 75) {
      confText = 'High';
      confColor = '#10b981'; // Green
    } else if (confidence > 55) {
      confText = 'Medium';
      confColor = '#fb923c'; // Orange
    }

    return {
      bestMarket,
      totalDailySavings,
      confidence,
      confText,
      confColor
    };
  }, [currentDayData]);

  // TOD configurations for display
  const todDetails: Record<string, { time: string; type: string; color: string }> = {
    'TOD-1': { time: '05:00-10:00', type: 'Off Peak', color: '#10b981' },
    'TOD-2': { time: '10:00-19:00', type: 'Normal', color: '#3b82f6' },
    'TOD-3': { time: '19:00-03:00', type: 'Peak', color: '#ef4444' },
    'TOD-4': { time: '03:00-05:00', type: 'Normal', color: '#3b82f6' },
    'RTC':   { time: '00:00-24:00', type: 'Round The Clock', color: '#8b5cf6' }
  };

  const markets = ['RTM', 'DAM', 'GDAM'];
  const marketKeys: ('rtm' | 'dam' | 'gdam')[] = ['rtm', 'dam', 'gdam'];

  // Format currency
  const formatCurrency = (val: number | null | undefined) => {
    return val != null && val > 0 ? `₹${val.toFixed(1)}` : 'N/A';
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Moving Background Blobs */}
      <div className="mrf-background-mesh">
        <div className="mrf-mesh-blob mrf-blob-1"></div>
        <div className="mrf-mesh-blob mrf-blob-2"></div>
        <div className="mrf-mesh-blob mrf-blob-3"></div>
      </div>

      {/* Header section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2.5,
        zIndex: 2,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ 
            color: '#10B981', 
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            p: 1.8,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PriceCheckIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5, fontSize: '1.8rem' }}>
              Market Recommendation
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              AI-driven daily recommendations across DAM, RTM, and GDAM to optimize procurement costs.
            </Typography>
          </Box>
        </Box>

        {/* Date Filter & Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box className="mrf-picker-container">
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Forecast Range:
            </Typography>
            <DateRangePicker 
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              minDate={tomorrowStr}
              maxDate={endForecastStr}
              maxDays={7}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              sx={{ 
                bgcolor: '#10B981', 
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                px: 2.5,
                py: 0.6,
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', zIndex: 2 }}>
          <CircularProgress sx={{ color: '#10B981' }} size={60} />
        </Box>
      ) : error ? (
        <Box sx={{ zIndex: 2 }}>
          <Alert severity="error" variant="filled" sx={{ borderRadius: 3, py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Error Fetching Recommendation</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </Box>
      ) : currentDayData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, zIndex: 2 }}>
          
          {/* Pagination Controls */}
          <Paper className="mrf-glass-card" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="outlined"
              startIcon={<ChevronLeftIcon />}
              onClick={handlePrevDay}
              disabled={currentPageIndex === 0}
              sx={{ 
                color: 'text.primary', 
                borderColor: 'rgba(255,255,255,0.12)', 
                textTransform: 'none',
                borderRadius: '10px',
                '&:hover': { borderColor: 'rgba(255,255,255,0.25)', bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              Previous Day
            </Button>

            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>
              Predictions for: {formatDisplayDate(currentDayData.date)}
            </Typography>

            <Button 
              variant="outlined"
              endIcon={<ChevronRightIcon />}
              onClick={handleNextDay}
              disabled={currentPageIndex === results.length - 1}
              sx={{ 
                color: 'text.primary', 
                borderColor: 'rgba(255,255,255,0.12)', 
                textTransform: 'none',
                borderRadius: '10px',
                '&:hover': { borderColor: 'rgba(255,255,255,0.25)', bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              Next Day
            </Button>
          </Paper>

          {/* Daily Summary Box */}
          {summary && (
            <Paper className="mrf-glass-card" sx={{ p: 3.5 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', mb: 1 }}>
                    Recommended Daily Market
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 850, 
                    color: summary.bestMarket === 'DAM' ? '#60a5fa' : summary.bestMarket === 'RTM' ? '#f87171' : '#34d399',
                    letterSpacing: '-1px'
                  }}>
                    {summary.bestMarket}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                  <Box sx={{ width: '1px', height: '60px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                </Grid>

                <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', mb: 1 }}>
                    Total Est. Daily Savings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#34d399', letterSpacing: '-0.5px' }}>
                    ₹{summary.totalDailySavings.toFixed(1)} / MWh
                  </Typography>
                </Grid>

                <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                  <Box sx={{ width: '1px', height: '60px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                </Grid>

                <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Model Confidence
                    </Typography>
                    <Tooltip title="Confidence score based on the separation spread of pricing predictions across markets.">
                      <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'pointer' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: summary.confColor, letterSpacing: '-0.5px' }}>
                    {summary.confidence.toFixed(1)}% <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.8 }}>({summary.confText})</span>
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Detailed Matrix Table */}
          <Paper className="mrf-glass-card" sx={{ p: 3, overflowX: 'auto' }}>
            <table className="mrf-matrix-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: '100px', fontSize: '0.95rem' }}>Market</th>
                  {currentDayData.slots.map((slot) => {
                    const details = todDetails[slot.tod] || { time: '', type: '', color: '#94a3b8' };
                    return (
                      <th key={slot.tod}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', mb: 0.2 }}>
                          {slot.tod}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 500 }}>
                          {details.time}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          display: 'inline-block', 
                          color: details.color, 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          fontSize: '0.62rem',
                          letterSpacing: '0.05em',
                          mt: 0.5
                        }}>
                          {details.type}
                        </Typography>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {markets.map((market, mIdx) => {
                  const mKey = marketKeys[mIdx];
                  return (
                    <tr key={market}>
                      <td className="mrf-row-header">{market}</td>
                      {currentDayData.slots.map((slot) => {
                        const isRecommended = slot.prediction === market;
                        
                        // Render mini-history values
                        const renderMiniHistory = () => {
                          if (!slot.history || slot.history.length === 0) {
                            return <tr><td colSpan={2} style={{ textAlign: 'center', color: '#64748b' }}>No data</td></tr>;
                          }

                          return slot.history.map((day) => {
                            // Find low, mid, high among dam, rtm, gdam for color coding
                            const prices = [
                              { m: 'dam', p: day.dam },
                              { m: 'rtm', p: day.rtm },
                              { m: 'gdam', p: day.gdam }
                            ].filter(x => x.p != null && x.p > 0);

                            let minPrice = Infinity;
                            let maxPrice = -Infinity;
                            if (prices.length > 0) {
                              minPrice = Math.min(...prices.map(x => x.p!));
                              maxPrice = Math.max(...prices.map(x => x.p!));
                            }

                            const dayPrice = day[mKey];
                            let colorClass = 'mrf-price-med';
                            if (dayPrice == null || dayPrice === 0) colorClass = 'mrf-price-na';
                            else if (dayPrice === minPrice) colorClass = 'mrf-price-low';
                            else if (dayPrice === maxPrice) colorClass = 'mrf-price-high';

                            // Format history date from YYYY-MM-DD to DD-MM (Short)
                            const formatHistoryDate = (dStr: string) => {
                              const parts = dStr.split('-');
                              if (parts.length !== 3) return dStr;
                              return `${parts[2]}/${parts[1]}`;
                            };

                            return (
                              <tr key={day.date}>
                                <td>{formatHistoryDate(day.date)}</td>
                                <td className={colorClass}>{formatCurrency(dayPrice)}</td>
                              </tr>
                            );
                          });
                        };

                        const cellClass = isRecommended 
                          ? `mrf-matrix-cell recommended-${market.toLowerCase()}` 
                          : 'mrf-matrix-cell';

                        const rollMean = slot[`${mKey}_mean` as keyof SlotData] as number;

                        return (
                          <td key={slot.tod} className={cellClass}>
                            <Box className="cell-content">
                              {/* Star Badge */}
                              <Box 
                                className={`mrf-badge mrf-badge-${market.toLowerCase()}`}
                                sx={{ visibility: isRecommended ? 'visible' : 'hidden', minHeight: '20px' }}
                              >
                                ★ Recommended
                              </Box>

                              {/* Est Savings */}
                              <Typography 
                                className="mrf-savings-conf"
                                sx={{ visibility: (isRecommended && slot.savings > 0) ? 'visible' : 'hidden', minHeight: '16px' }}
                              >
                                Savings: ₹{slot.savings.toFixed(1)}
                              </Typography>

                              {/* Mini History Table */}
                              <table className="mrf-mini-history">
                                <tbody>
                                  {renderMiniHistory()}
                                </tbody>
                              </table>

                              {/* 7D Average */}
                              <Box className="mrf-mean-row">
                                <span>7D Avg:</span>
                                <span className="mrf-mean-val">{formatCurrency(rollMean)}</span>
                              </Box>
                            </Box>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Paper>
        </Box>
      ) : (
        <Box sx={{ zIndex: 2 }}>
          <Alert severity="info" variant="filled" sx={{ borderRadius: 3 }}>
            <Typography variant="body1">Select a valid date range to view predictions.</Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
