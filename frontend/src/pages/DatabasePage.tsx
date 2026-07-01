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
  MenuItem
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Map as MapIcon,
  Cloud as CloudIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';
import AllIndiaDemandView from './database/AllIndiaDemandView';
import StateWiseDemandView from './database/StateWiseDemandView';

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
  
  const showAllIndia = path.includes('/all-india-demand');
  const showStateWise = path.includes('/state-wise-demand');
  const showWeather = path.includes('/weather');
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherDataRow[] | null>(null);
  const [allIndiaDemand, setAllIndiaDemand] = useState<{demandMet: number, unit: string} | null>(null);
  const [stateWiseDemand, setStateWiseDemand] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-30');
  const [selectedTime, setSelectedTime] = useState<string>('16:15');

  const [exportOpen, setExportOpen] = useState(false);
  const [exportDataset, setExportDataset] = useState('npp');
  const [exportStartDate, setExportStartDate] = useState('2024-04-01');
  const [exportEndDate, setExportEndDate] = useState('2026-06-30');

  const handleDownloadCsv = () => {
    const url = `${apiClient.defaults.baseURL || 'http://localhost:3000/api'}/database/export/csv?dataset=${exportDataset}&startDate=${exportStartDate}&endDate=${exportEndDate}`;
    window.open(url, '_blank');
    setExportOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [weatherRes, demandRes] = await Promise.all([
        apiClient.get('/database/weather'),
        apiClient.get(`/database/demand?date=${selectedDate}&time=${selectedTime}`)
      ]);
        
        if (weatherRes.data?.success && weatherRes.data?.data) {
          setWeatherData(weatherRes.data.data);
        } else {
          console.error("weatherRes missing data", weatherRes);
        }
        
        if (demandRes.data?.success) {
          setAllIndiaDemand(demandRes.data.data.allIndiaDemand);
          setStateWiseDemand(demandRes.data.data.stateWiseDemand);
        } else {
          console.error("demandRes missing data", demandRes);
        }
      } catch (err: any) {
        console.error('Error fetching database data:', err);
        setErrorMsg(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedTime]);

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
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <Typography variant="h1" color="text.primary" gutterBottom>
            Database Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            Real-time & Historical metrics for All India Demand, State Demand, and Weather.
          </Typography>
        </Box>
        
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
                onChange={(e) => setExportDataset(e.target.value)}
              >
                <MenuItem value="npp">All India Demand (NPP)</MenuItem>
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
      ) : (
        <Grid container spacing={4}>
          {/* All India Demand Section */}
          {showAllIndia && (
          <Grid item xs={12}>
            <AllIndiaDemandView />
          </Grid>
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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
                  <Typography variant="h6" fontWeight="600">
                    7-Day Weather Forecast (Open-Meteo)
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  * Live 7-day weather forecast for New Delhi (Lat: 28.61, Lon: 77.20). Updates automatically every midnight.
                </Typography>
                
                {weatherData && weatherData.length > 0 ? (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                    <Table size="small">
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
                          .filter((row: any) => {
                            const today = new Date().toISOString().split('T')[0];
                            const next7Days = new Date();
                            next7Days.setDate(next7Days.getDate() + 7);
                            const next7DaysStr = next7Days.toISOString().split('T')[0];
                            return row.date >= today && row.date <= next7DaysStr;
                          })
                          .map((row: any, i: number) => (
                            <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                              <TableCell>{row.date}</TableCell>
                              <TableCell>{row.maxTemp}</TableCell>
                              <TableCell>{row.minTemp}</TableCell>
                              <TableCell>{row.relativeHumidity}</TableCell>
                              <TableCell>{row.precipitationProb}</TableCell>
                              <TableCell>{row.precipitationSum}</TableCell>
                              <TableCell>{row.sunshineDuration}</TableCell>
                              <TableCell>{row.sunrise}</TableCell>
                              <TableCell>{row.sunset}</TableCell>
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
      )}
    </Box>
  );
}
