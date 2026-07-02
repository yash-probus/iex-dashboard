import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Download as DownloadIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

import AllIndiaDemandView from './database/AllIndiaDemandView';
import StateWiseDemandView from './database/StateWiseDemandView';
import GenerationDataView from './database/GenerationDataView';

interface WeatherDataRow {
  date: string;
  maxTemp: number;
  minTemp: number;
  windSpeed: number;
  relativeHumidity: number;
  precipitationProb: number;
  precipitationSum: number;
  sunshineDuration: number;
  sunrise: string;
  sunset: string;
  isActual: boolean;
}

interface StateDemand {
  name: string;
  demand: number;
  unit: string;
}

export default function DatabasePage() {
  const theme = useTheme();
  const location = useLocation();
  const path = location.pathname;
  

  const showNpp = path.includes('/all-india-demand');
  const showGeneration = path.includes('/generation-data');
  const showDateRange = showNpp || showGeneration;
  const showStateWise = path.includes('/state-wise-demand');
  const showWeather = path.includes('/weather');
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherDataRow[] | null>(null);

  const [allIndiaDemand, setAllIndiaDemand] = useState<any>(null);
  const [stateWiseDemand, setStateWiseDemand] = useState<any>(null);
  const [generationData, setGenerationData] = useState<any>(null);
  
  const getTodayDateString = () => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    // Round down to nearest 15 mins
    const minutes = Math.floor(now.getMinutes() / 15) * 15;
    return String(now.getHours()).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState<string>(getCurrentTimeString());

  // For NPP View, we use a date range — default to last 7 days
  // Historical data is available from Sep 2025 onwards (NPP API limitation)
  const [nppStartDate, setNppStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [nppEndDate, setNppEndDate] = useState<string>(getTodayDateString());

  const [genStartDate, setGenStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [genEndDate, setGenEndDate] = useState<string>(getTodayDateString());

  // Weather view date range — default to last 30 days + next 7 days forecast
  const [weatherStartDate, setWeatherStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [weatherEndDate, setWeatherEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [exportOpen, setExportOpen] = useState(false);
  const [exportDataset, setExportDataset] = useState<string>(() => {
    if (path.includes('/weather')) return 'weather';
    if (path.includes('/state-wise-demand')) return 'state';
    return 'npp';
  });
  const [exportStartDate, setExportStartDate] = useState('2024-07-01');
  const [exportEndDate, setExportEndDate] = useState(getTodayDateString());

  const handleDownloadCsv = () => {
    const url = `${apiClient.defaults.baseURL || 'http://localhost:3000/api'}/database/export/csv?dataset=${exportDataset}&startDate=${exportStartDate}&endDate=${exportEndDate}`;
    window.open(url, '_blank');
    setExportOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (showWeather) {
        const weatherRes = await apiClient.get(`/database/weather?startDate=${weatherStartDate}&endDate=${weatherEndDate}`);
        if (weatherRes.data?.success && weatherRes.data?.data) {
          setWeatherData(weatherRes.data.data);
        } else {
          console.error("weatherRes missing data", weatherRes);
        }
      }

      if (showNpp) {
        const [demandRes, genRes] = await Promise.all([
          apiClient.get(`/database/demand?date=${selectedDate}&time=${selectedTime}&startDate=${committedNppStartDate}&endDate=${committedNppEndDate}`),
          apiClient.get(`/database/generation?date=${selectedDate}&startDate=${committedGenStartDate}&endDate=${committedGenEndDate}`)
        ]);

        if (demandRes.data?.success) {
          setAllIndiaDemand(demandRes.data.data.allIndiaDemand);
          setStateWiseDemand(demandRes.data.data.stateWiseDemand);
        } else {
          console.error("demandRes missing data", demandRes);
        }

        if (genRes.data?.success) {
          setGenerationData(genRes.data.data);
        } else {
          console.error("genRes missing data", genRes);
        }
      }

      if (showStateWise) {
        const demandRes = await apiClient.get(`/database/demand?date=${selectedDate}&time=${selectedTime}&startDate=${committedNppStartDate}&endDate=${committedNppEndDate}`);
        if (demandRes.data?.success) {
          setAllIndiaDemand(demandRes.data.data.allIndiaDemand);
          setStateWiseDemand(demandRes.data.data.stateWiseDemand);
        }
      }
    } catch (err: any) {
      console.error('Error fetching database data:', err);
      setErrorMsg(err.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Committed date range — only updated when Submit is clicked
  const [committedNppStartDate, setCommittedNppStartDate] = useState(nppStartDate);
  const [committedNppEndDate, setCommittedNppEndDate] = useState(nppEndDate);

  const [committedGenStartDate, setCommittedGenStartDate] = useState(genStartDate);
  const [committedGenEndDate, setCommittedGenEndDate] = useState(genEndDate);

  const handleNppSubmit = () => {
    setCommittedNppStartDate(nppStartDate);
    setCommittedNppEndDate(nppEndDate);
  };

  const handleGenSubmit = () => {
    setCommittedGenStartDate(genStartDate);
    setCommittedGenEndDate(genEndDate);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedTime, committedNppStartDate, committedNppEndDate, committedGenStartDate, committedGenEndDate, weatherStartDate, weatherEndDate, path]);

  return (
    <Box
      className="animate-fade-in-up"
      sx={{
        minHeight: '100vh',
        bgcolor: '#F8FAFC',
        pt: { xs: 8, sm: 12 },
        pb: 8,
        px: { xs: 2, sm: 4, md: 8 },
        maxWidth: theme.breakpoints.values.xl,
        mx: 'auto',
      }}
    >
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
        
        {(!showDateRange) && (
        <Box 
          className="glass"
          sx={{ 
            display: 'flex', 
            gap: 2, 
            p: 2, 
            borderRadius: 3,
            alignItems: 'flex-end',
            flexWrap: 'wrap'
          }}
        >

            <>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</Typography>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min="2024-04-01"
                  max="2026-06-30"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#0F172A',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#EA580C'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</Typography>
                <input 
                  type="time" 
                  value={selectedTime}
                  step="900"
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#0F172A',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#EA580C'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </Box>
            </>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />} 
            onClick={() => setExportOpen(true)}
            sx={{ 
              ml: { xs: 0, sm: 2 }, 
              height: '42px', 
              borderRadius: '10px',
            }}
          >
            Export CSV
          </Button>
        </Box>
        )}
      </Box>


      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Export Historical Data (CSV)</DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Dataset</InputLabel>
              <Select
                value={exportDataset}
                label="Dataset"
                onChange={(e) => setExportDataset(e.target.value as string)}
              >
                <MenuItem value="npp">All India Demand (NPP)</MenuItem>
                <MenuItem value="generation">Generation Data</MenuItem>
                <MenuItem value="state">State Wise Demand</MenuItem>
                <MenuItem value="weather">Weather Analytics</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>Start Date</Typography>
                <input 
                  type="date" 
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #C4C4C4', outline: 'none', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>End Date</Typography>
                <input 
                  type="date" 
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #C4C4C4', outline: 'none', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </Box>
            </Box>
            
            {exportDataset === 'state' && (
              <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 1, border: '1px solid #FEF08A' }}>
                <Typography variant="body2" color="#92400E">
                  <strong>Warning:</strong> Exporting the entire 2-year State Demand dataset will generate over 2.6 million rows (~150MB). Microsoft Excel has a hard limit of 1,048,576 rows. Consider exporting in 6-month chunks.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setExportOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDownloadCsv} variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>Download CSV</Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
        </Box>
      ) : errorMsg ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 10, gap: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
          <Typography variant="h6" color="error.main" fontWeight={600}>Failed to load data</Typography>
          <Typography variant="body2" color="text.secondary">{errorMsg}</Typography>
          <Button variant="outlined" color="primary" onClick={fetchData}>Retry</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Main Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Grid container spacing={4}>


          {/* NPP Data Section (Demand & Generation) */}
          {showNpp && (
            <>
              <Grid item xs={12}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Real Time Demand Met Data
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>From</Typography>
                      <input 
                        type="date" 
                        value={nppStartDate}
                        onChange={(e) => setNppStartDate(e.target.value)}
                        style={{
                          padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none',
                          fontFamily: 'inherit', fontSize: '0.875rem', backgroundColor: '#FFF', color: '#0F172A',
                          transition: 'all 0.2s'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>To</Typography>
                      <input 
                        type="date" 
                        value={nppEndDate}
                        onChange={(e) => setNppEndDate(e.target.value)}
                        style={{
                          padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none',
                          fontFamily: 'inherit', fontSize: '0.875rem', backgroundColor: '#FFF', color: '#0F172A',
                          transition: 'all 0.2s'
                        }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={handleNppSubmit}
                      sx={{
                        height: '42px',
                        px: 3,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
                      }}
                    >
                      Submit
                    </Button>
                  </Box>
                </Box>
                <AllIndiaDemandView 
                  data={allIndiaDemand} 
                  startDate={nppStartDate} 
                  endDate={nppEndDate} 
                  onStartDateChange={setNppStartDate} 
                  onEndDateChange={setNppEndDate} 
                  onExport={() => { 
                    const url = `${apiClient.defaults.baseURL || 'http://localhost:3000/api'}/database/export/csv?dataset=npp&startDate=${committedNppStartDate}&endDate=${committedNppEndDate}`;
                    window.open(url, '_blank');
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 3, mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Real Time Generation Data
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>From</Typography>
                      <input 
                        type="date" 
                        value={genStartDate}
                        onChange={(e) => setGenStartDate(e.target.value)}
                        style={{
                          padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none',
                          fontFamily: 'inherit', fontSize: '0.875rem', backgroundColor: '#FFF', color: '#0F172A',
                          transition: 'all 0.2s'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>To</Typography>
                      <input 
                        type="date" 
                        value={genEndDate}
                        onChange={(e) => setGenEndDate(e.target.value)}
                        style={{
                          padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none',
                          fontFamily: 'inherit', fontSize: '0.875rem', backgroundColor: '#FFF', color: '#0F172A',
                          transition: 'all 0.2s'
                        }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={handleGenSubmit}
                      sx={{
                        height: '42px',
                        px: 3,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
                      }}
                    >
                      Submit
                    </Button>
                  </Box>
                </Box>
                <GenerationDataView 
                  data={generationData} 
                  startDate={genStartDate} 
                  endDate={genEndDate} 
                  onStartDateChange={setGenStartDate} 
                  onEndDateChange={setGenEndDate} 
                  onExport={() => { 
                    const url = `${apiClient.defaults.baseURL || 'http://localhost:3000/api'}/database/export/csv?dataset=generation&startDate=${committedGenStartDate}&endDate=${committedGenEndDate}`;
                    window.open(url, '_blank');
                  }}
                />
              </Grid>
            </>
          )}

          {/* State Wise Demand Section */}
          {showStateWise && (
          <Grid item xs={12}>
            <StateWiseDemandView data={stateWiseDemand} />
          </Grid>
          )}

          {/* Weather Data Section */}
          {showWeather && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha('#3B8FF3', 0.1),
                        color: '#3B8FF3',
                        mr: 2,
                      }}
                    >
                      <CloudIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="600">
                        Weather Data (New Delhi)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Historical actuals from Jul 2024 + 7-day rolling forecast. Source: Open-Meteo.
                      </Typography>
                    </Box>
                  </Box>
                  {/* Date range controls */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>From</Typography>
                      <input
                        type="date"
                        value={weatherStartDate}
                        onChange={(e) => setWeatherStartDate(e.target.value)}
                        min="2024-07-01"
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none',
                          fontFamily: 'inherit', fontSize: '0.875rem', backgroundColor: '#FFF', color: '#0F172A'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>To</Typography>
                      <input
                        type="date"
                        value={weatherEndDate}
                        onChange={(e) => setWeatherEndDate(e.target.value)}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none',
                          fontFamily: 'inherit', fontSize: '0.875rem', backgroundColor: '#FFF', color: '#0F172A'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                {weatherData && weatherData.length > 0 ? (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Max Temp (°C)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Min Temp (°C)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Humidity (%)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Precip. Prob (%)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Precip. (mm)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sunshine (hrs)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sunrise</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sunset</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Wind Speed (km/h)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weatherData
                          .map((row: WeatherDataRow, i: number) => (                            <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                              <TableCell>{row.date}</TableCell>
                              <TableCell>{row.maxTemp}</TableCell>
                              <TableCell>{row.minTemp}</TableCell>
                              <TableCell>{row.relativeHumidity ?? '-'}</TableCell>
                              <TableCell>{row.precipitationProb ?? '-'}</TableCell>
                              <TableCell>{row.precipitationSum ?? '-'}</TableCell>
                              <TableCell>{row.sunshineDuration ?? '-'}</TableCell>
                              <TableCell>{row.sunrise || '-'}</TableCell>
                              <TableCell>{row.sunset || '-'}</TableCell>
                              <TableCell>{row.windSpeed}</TableCell>
                              <TableCell>
                                <Box sx={{ 
                                  display: 'inline-block',
                                  px: 1, py: 0.5, 
                                  borderRadius: 1, 
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  color: row.isActual ? '#15803D' : '#C2410C',
                                  bgcolor: row.isActual ? '#DCFCE7' : '#FFEDD5'
                                }}>
                                  {row.isActual ? 'Actual' : 'Forecast'}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography>Unable to load weather data.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          )}

            </Grid>
          </Box>
        </Box>
      )}
    </Box>
  );
}
