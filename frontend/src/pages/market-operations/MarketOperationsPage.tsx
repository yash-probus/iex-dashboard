import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress,
  Button, TextField, Alert
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
  }, [startDate, endDate]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await fetchMarketOperations(startDate || undefined, endDate || undefined);
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
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
            Market Operations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare Market Clearing Prices (MCP) across DAM, RTM, and GDAM.
          </Typography>
        </Box>
      </Box>


      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button 
            variant="outlined" 
            onClick={() => { setStartDate(''); setEndDate(''); }}
            disabled={!startDate && !endDate}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Data Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Timeblock</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>DAM MCP</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>RTM MCP</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>GDAM MCP</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>DAM vs RTM</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>DAM vs GDAM</TableCell>
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
                records.map((row) => {
                  const dam = Number(row.damMcp);
                  const rtm = Number(row.rtmMcp);
                  const gdam = Number(row.gdamMcp);
                  const damVsRtm = dam - rtm;
                  const damVsGdam = dam - gdam;

                  return (
                    <TableRow key={row.id} hover>
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
      </Paper>
    </Box>
  );
}

