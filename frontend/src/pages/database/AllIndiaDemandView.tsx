import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  useTheme,
  alpha,
  Paper,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../api/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Interface for the data from the API
interface NppData {
  time: string;
  datetime: string;
  demandMet: number;
  hydro: number;
  wind: number;
  gas: number;
  solar: number;
  nuclear: number;
  thermal: number;
}

export default function AllIndiaDemandView() {
  const theme = useTheme();
  
  const [data, setData] = useState<NppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState('2026-06-30');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/database/demand?date=${selectedDate}`);
        if (response.data?.success && response.data.data.allIndiaDemand) {
          // Format the DB response to match the chart requirements
          const formattedData = response.data.data.allIndiaDemand.map((item: any) => ({
            time: item.timeStr,
            datetime: `${item.date.split('-').reverse().join('/')} ${item.timeStr}`,
            demandMet: item.demandMet,
            hydro: item.hydro,
            wind: item.wind,
            gas: item.gas,
            solar: item.solar,
            nuclear: item.nuclear,
            thermal: item.thermal,
          }));
          setData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching NPP data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const latestData = data[data.length - 1];
  
  const generationSources = [
    { source: 'HYDRO GENERATION', value: latestData.hydro, color: '#3B8FF3' },
    { source: 'WIND GENERATION', value: latestData.wind, color: '#10B981' },
    { source: 'GAS GENERATION', value: latestData.gas, color: '#FCD34D' },
    { source: 'SOLAR GENERATION', value: latestData.solar, color: '#F97316' },
    { source: 'NUCLEAR GENERATION', value: latestData.nuclear, color: '#6366F1' },
    { source: 'THERMAL GENERATION', value: latestData.thermal, color: '#D97750' }, // More brownish orange
  ];

  const handleDownload = (type: 'demand' | 'generation') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'demand') {
      csvContent += "Date & Time,Demand Met(MW)\n";
      data.forEach(row => {
        csvContent += `${row.datetime},${row.demandMet}\n`;
      });
    } else {
      csvContent += "Date & Time,Hydro (MW),Wind (MW),Gas (MW),Solar (MW),Nuclear (MW),Thermal (MW)\n";
      data.forEach(row => {
        csvContent += `${row.datetime},${row.hydro},${row.wind},${row.gas},${row.solar},${row.nuclear},${row.thermal}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_data_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Demand Met */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.1),
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="subtitle2" color="primary.main" sx={{ mb: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              REAL TIME DEMAND MET DATA (SOURCE-MERIT INDIA) - {selectedDate.split('-').reverse().join('-')}
            </Typography>
            
            <Typography variant="h3" color="text.primary" sx={{ mb: 4 }}>
              All India Demand Met (MW)
            </Typography>

            <Box sx={{ height: 300, width: '100%', mb: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val, i) => i % 4 === 0 ? val : ''} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    label={{ value: '(MW)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10 } }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Demand Met']}
                    labelStyle={{ color: 'black' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Line 
                    type="monotone" 
                    dataKey="demandMet" 
                    name="Demand Met"
                    stroke="#43A0FF" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Demand Table */}
            <TableContainer component={Paper} elevation={0} sx={{ mb: 2, flexGrow: 1, border: 'none', background: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Demand Met(MW)</TableCell>
                    <TableCell>Date & Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) => (
                    <TableRow key={i} sx={{ '&:hover': { backgroundColor: '#F1F5F9' }, transition: 'background-color 0.2s' }}>
                      <TableCell sx={{ fontWeight: 500 }}>{row.demandMet.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.datetime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 2, borderTop: '1px solid #F1F5F9' }}>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ '.MuiTablePagination-toolbar': { minHeight: '40px', p: 0 } }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" color="primary" onClick={() => handleDownload('demand')} sx={{ textTransform: 'none', borderRadius: '8px' }}>
                  Download CSV
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Generation Data */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.1),
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="subtitle2" color="primary.main" sx={{ mb: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              REAL TIME GENERATION DATA (SOURCE-MERIT INDIA) - {selectedDate.split('-').reverse().join('-')}
            </Typography>
            
            <Typography variant="h3" color="text.primary" sx={{ mb: 4 }}>
              All India Generation (MW)
            </Typography>

            <Box sx={{ height: 300, width: '100%', mb: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val, i) => i % 4 === 0 ? val : ''} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    label={{ value: '(MW)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10 } }}
                  />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString()}
                    labelStyle={{ color: 'black' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                  <Area type="monotone" dataKey="hydro" name="HYDRO" stackId="1" stroke="#3B8FF3" fill="#3B8FF3" />
                  <Area type="monotone" dataKey="wind" name="WIND" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="gas" name="GAS" stackId="1" stroke="#FCD34D" fill="#FCD34D" />
                  <Area type="monotone" dataKey="solar" name="SOLAR" stackId="1" stroke="#F97316" fill="#F97316" />
                  <Area type="monotone" dataKey="nuclear" name="NUCLEAR" stackId="1" stroke="#6366F1" fill="#6366F1" />
                  <Area type="monotone" dataKey="thermal" name="THERMAL" stackId="1" stroke="#D97750" fill="#D97750" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            {/* Generation Table (Static for latest data) */}
            <TableContainer component={Paper} elevation={0} sx={{ mb: 2, flexGrow: 1, border: 'none', background: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell>Generation (MW)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generationSources.map((item, i) => (
                    <TableRow key={i} sx={{ '&:hover': { backgroundColor: '#F1F5F9' }, transition: 'background-color 0.2s' }}>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.source}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.value.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2, borderTop: '1px solid #F1F5F9' }}>
              <Button variant="outlined" color="primary" onClick={() => handleDownload('generation')} sx={{ textTransform: 'none', borderRadius: '8px' }}>
                Download CSV
              </Button>
            </Box>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}
