import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Grid, Divider
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

const TraderPerformanceActualPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await apiClient.get('/trader-performance-actual');
      setEntries(res.data.data || []);
    } catch (err: any) {
      alert('Failed to fetch entries: ' + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, entryId: string, ym: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await apiClient.post('/trader-performance-actual/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const entry = entries.find(x => x.id === entryId);
      if (entry) {
        const todConsumptions = { ...entry.todConsumptions };
        const cur = todConsumptions[ym] || {};
        const existingReports = cur.traderReports || { data: {}, files_status: [] };
        const mergedReports = {
          data: { ...existingReports.data, ...(res.data.data || {}) },
          files_status: [...(existingReports.files_status || []), ...(res.data.files_status || [])]
        };
        todConsumptions[ym] = { ...cur, traderReports: mergedReports };

        await apiClient.put(`/trader-performance-actual/${entryId}`, { todConsumptions });
        alert('PDFs uploaded and data merged successfully!');
        fetchEntries();
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCompare = async (id: string) => {
    setSelectedEntryId(id);
    setComparing(true);
    try {
      const res = await apiClient.get(`/trader-performance-actual/${id}/compare`);
      setComparisonData(res.data.data);
      alert('Comparison loaded successfully');
    } catch (err: any) {
      alert('Comparison failed: ' + err.message);
    } finally {
      setComparing(false);
    }
  };

  const createTestEntry = async () => {
    try {
      const payload = {
        clientName: "Test Client",
        industryName: "Test Industry",
        address: "Test",
        todConsumptions: {
          "2023-01": {
            "Start Date": 1,
            "End Date": 31,
            "Electricity Duty": "Yes"
          }
        }
      };
      await apiClient.post('/trader-performance-actual', payload);
      fetchEntries();
      alert('Test entry created');
    } catch (err: any) {
      alert('Failed to create test entry: ' + err.message);
    }
  };

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">Trader Performance Actual</Typography>
          <Button variant="contained" onClick={createTestEntry}>Create Test Entry</Button>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" mb={2}>Entries</Typography>
              {entries.map(entry => (
                <Box key={entry.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography fontWeight="bold">{entry.clientName} - {entry.industryName}</Typography>
                  <Typography variant="body2" color="text.secondary">ID: {entry.id}</Typography>
                  
                  {Object.keys(entry.todConsumptions || {}).map(ym => (
                    <Box key={ym} sx={{ mt: 1, p: 1, bgcolor: '#f9fafb', borderRadius: 1 }}>
                      <Typography variant="body2">Month: {ym}</Typography>
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploading}
                        sx={{ mt: 1 }}
                      >
                        Upload Trader PDFs
                        <input type="file" hidden multiple accept="application/pdf" onChange={(e) => handleFileUpload(e, entry.id, ym)} />
                      </Button>
                      {(entry.todConsumptions[ym]?.traderReports?.data) && (
                        <Typography variant="caption" display="block" color="success.main" mt={1}>
                          {Object.keys(entry.todConsumptions[ym].traderReports.data).length} day(s) of trader reports loaded.
                        </Typography>
                      )}
                    </Box>
                  ))}

                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ mt: 2 }} 
                    onClick={() => handleCompare(entry.id)}
                    disabled={comparing}
                  >
                    Compare Savings
                  </Button>
                </Box>
              ))}
              {entries.length === 0 && <Typography>No entries found.</Typography>}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, minHeight: 400 }}>
              <Typography variant="h6" mb={3}>Comparison Dashboard</Typography>
              
              {comparing && <CircularProgress />}
              
              {!comparing && !comparisonData && (
                <Typography color="text.secondary">Select an entry and click "Compare Savings" to view results.</Typography>
              )}

              {!comparing && comparisonData && (
                <Box>
                  <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={6}>
                      <Box p={3} sx={{ bgcolor: '#eef2ff', borderRadius: 2, border: '1px solid #c7d2fe' }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="#4338ca">Platform Optimized Savings</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="h4" color="#4f46e5" fontWeight="bold">
                          ₹ {comparisonData.platform?.totalSavings?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box p={3} sx={{ bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #a7f3d0' }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="#047857">Actual Trader Savings</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="h4" color="#059669" fontWeight="bold">
                          ₹ {comparisonData.trader?.totalSavings?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Detailed Breakdown</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                        <TableRow>
                          <TableCell><strong>Metric</strong></TableCell>
                          <TableCell align="right"><strong>Platform</strong></TableCell>
                          <TableCell align="right"><strong>Trader Actual</strong></TableCell>
                          <TableCell align="right"><strong>Diff (Platform - Trader)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Savings (₹)</TableCell>
                          <TableCell align="right">{comparisonData.platform?.totalSavings?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right">{comparisonData.trader?.totalSavings?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right" sx={{ color: (comparisonData.platform?.totalSavings - comparisonData.trader?.totalSavings) > 0 ? 'success.main' : 'error.main' }}>
                            {((comparisonData.platform?.totalSavings || 0) - (comparisonData.trader?.totalSavings || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Baseline Cost (₹)</TableCell>
                          <TableCell align="right">{comparisonData.platform?.totalBaselineCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right">{comparisonData.trader?.totalBaselineCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Optimized Cost (₹)</TableCell>
                          <TableCell align="right">{comparisonData.platform?.totalOptimizedCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right">{comparisonData.trader?.totalOptimizedCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right">-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default TraderPerformanceActualPage;
