import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress,
  Button, TextField, Alert
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { fetchMarketOperations, uploadMarketOperations, MarketOperation } from '../../api/marketOperations.api';

export default function MarketOperationsPage() {
  const [records, setRecords] = useState<MarketOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      
      const res = await uploadMarketOperations(file);
      setUploadSuccess(`Successfully uploaded ${res.count} records!`);
      loadRecords();
    } catch (error: any) {
      setUploadError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) event.target.value = '';
    }
  };

  // Helper function to determine colors based on the lowest, middle, and highest prices
  const getCellColor = (value: number, dam: number, rtm: number, gdam: number) => {
    if (dam === 0 && rtm === 0 && gdam === 0) return 'inherit'; // Edge case
    
    // Sort the unique values to find rank
    const uniqueValues = Array.from(new Set([dam, rtm, gdam])).sort((a, b) => a - b);
    
    if (uniqueValues.length === 1) return 'inherit'; // All same
    
    const lowest = uniqueValues[0];
    const highest = uniqueValues[uniqueValues.length - 1];
    
    if (value === lowest) return '#e8f5e9'; // Green background for lowest
    if (value === highest) return '#ffebee'; // Red background for highest
    
    // If it's the middle value (when there are 3 distinct values)
    if (uniqueValues.length === 3 && value === uniqueValues[1]) {
      return '#fff8e1'; // Yellow background for middle
    }
    
    return 'inherit';
  };

  const getTextColor = (value: number, dam: number, rtm: number, gdam: number) => {
    const uniqueValues = Array.from(new Set([dam, rtm, gdam])).sort((a, b) => a - b);
    if (uniqueValues.length === 1) return 'inherit';
    
    const lowest = uniqueValues[0];
    const highest = uniqueValues[uniqueValues.length - 1];
    
    if (value === lowest) return '#2e7d32'; // Green text
    if (value === highest) return '#c62828'; // Red text
    if (uniqueValues.length === 3 && value === uniqueValues[1]) return '#f57f17'; // Yellow/Orange text
    
    return 'inherit';
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
        <Box>
          <Button
            component="label"
            variant="contained"
            color="primary"
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
            disabled={uploading}
          >
            Upload Data (CSV/Excel)
            <input
              type="file"
              hidden
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      </Box>

      {uploadError && <Alert severity="error" sx={{ mb: 3 }}>{uploadError}</Alert>}
      {uploadSuccess && <Alert severity="success" sx={{ mb: 3 }}>{uploadSuccess}</Alert>}

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
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Timeblock</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="right">DAM MCP</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="right">RTM MCP</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }} align="right">GDAM MCP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No records found. Upload data to get started.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => {
                  const dam = Number(row.damMcp);
                  const rtm = Number(row.rtmMcp);
                  const gdam = Number(row.gdamMcp);

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.timeblock}</TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          bgcolor: getCellColor(dam, dam, rtm, gdam), 
                          color: getTextColor(dam, dam, rtm, gdam),
                          fontWeight: 500
                        }}
                      >
                        {dam.toFixed(2)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          bgcolor: getCellColor(rtm, dam, rtm, gdam), 
                          color: getTextColor(rtm, dam, rtm, gdam),
                          fontWeight: 500
                        }}
                      >
                        {rtm.toFixed(2)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          bgcolor: getCellColor(gdam, dam, rtm, gdam), 
                          color: getTextColor(gdam, dam, rtm, gdam),
                          fontWeight: 500
                        }}
                      >
                        {gdam.toFixed(2)}
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
