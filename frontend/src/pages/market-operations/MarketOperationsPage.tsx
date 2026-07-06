import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress,
  Button, TextField, Card, CardContent, Divider
} from '@mui/material';
import { fetchMarketOperations, MarketOperation } from '../../api/marketOperations.api';
import { formatOverviewDate, formatTimeblock } from '../../utils/date';

export default function MarketOperationsPage() {
  const [records, setRecords] = useState<MarketOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');


  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async (overrideStart?: string, overrideEnd?: string) => {
    try {
      setLoading(true);
      const sDate = overrideStart !== undefined ? overrideStart : startDate;
      const eDate = overrideEnd !== undefined ? overrideEnd : endDate;
      const data = await fetchMarketOperations(sDate || undefined, eDate || undefined);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load market operations', error);
    } finally {
      setLoading(false);
    }
  };



  // Helper function to determine text color based on the lowest, middle, and highest prices
  const getTextColor = (value: number, dam: number, rtm: number, gdam: number) => {
    if (dam === 0 && rtm === 0 && gdam === 0) return 'inherit';
    
    const uniqueValues = Array.from(new Set([dam, rtm, gdam])).sort((a, b) => a - b);
    if (uniqueValues.length === 1) return 'inherit';
    
    const lowest = uniqueValues[0];
    const highest = uniqueValues[uniqueValues.length - 1];
    
    if (value === lowest) return '#2e7d32'; // Green text
    if (value === highest) return '#c62828'; // Red text
    if (uniqueValues.length === 3 && value === uniqueValues[1]) return '#f57f17'; // Orange text
    
    return 'inherit';
  };

  // Helper for difference column color (positive = green, negative = red, zero = neutral)
  const getDiffColor = (diff: number) => {
    if (diff > 0) return '#2e7d32';
    if (diff < 0) return '#c62828';
    return 'inherit';
  };

  const formatDiff = (diff: number) => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Market Operations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Compare Market Clearing Prices (MCP) across DAM, RTM, and GDAM.
              </Typography>
            </Box>
            
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>Start Date</Typography>
                <TextField
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', height: '42px', bgcolor: '#FFF' } }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>End Date</Typography>
                <TextField
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', height: '42px', bgcolor: '#FFF' } }}
                />
              </Box>
              <Button
                variant="contained"
                onClick={() => loadRecords()}
                disabled={!startDate && !endDate}
                sx={{ px: 3, height: '42px', borderRadius: '10px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
              >
                Submit
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => { setStartDate(''); setEndDate(''); loadRecords('', ''); }}
                disabled={!startDate && !endDate}
                sx={{ height: '42px', borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Data Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px', flexGrow: 1, maxHeight: 'calc(100vh - 350px)' }}>
            <Table stickyHeader sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>Timeblock</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>DAM MCP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>RTM MCP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>GDAM MCP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>DAM vs RTM</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F8FAFC' }}>DAM vs GDAM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No records found. Upload data to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((row, index) => {
                    const dam = Number(row.damMcp);
                    const rtm = Number(row.rtmMcp);
                    const gdam = Number(row.gdamMcp);
                    const damVsRtm = dam - rtm;
                    const damVsGdam = dam - gdam;

                    return (
                      <TableRow key={row.id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                        <TableCell align="center">{formatOverviewDate(row.date)}</TableCell>
                        <TableCell align="center">{formatTimeblock(row.timeblock)}</TableCell>
                        <TableCell align="center">
                          <Box component="span" sx={{ color: getTextColor(dam, dam, rtm, gdam), fontWeight: 600 }}>
                            {dam.toFixed(2)}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box component="span" sx={{ color: getTextColor(rtm, dam, rtm, gdam), fontWeight: 600 }}>
                            {rtm.toFixed(2)}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box component="span" sx={{ color: getTextColor(gdam, dam, rtm, gdam), fontWeight: 600 }}>
                            {gdam.toFixed(2)}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box component="span" sx={{ color: getDiffColor(damVsRtm), fontWeight: 600 }}>
                            {formatDiff(damVsRtm)}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box component="span" sx={{ color: getDiffColor(damVsGdam), fontWeight: 600 }}>
                            {formatDiff(damVsGdam)}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

