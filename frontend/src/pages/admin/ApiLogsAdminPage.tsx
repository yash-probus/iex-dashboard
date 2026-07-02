import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  TextField, Select, MenuItem, FormControl, InputLabel, Button,
  TablePagination
} from '@mui/material';
import { fetchApiLogs, fetchUniqueApiNames, ApiLog } from '../../api/apiLog.api';

export default function ApiLogsAdminPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter States
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedApiName, setSelectedApiName] = useState<string>('');
  
  const [apiNamesList, setApiNamesList] = useState<string[]>([]);

  useEffect(() => {
    loadApiNames();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, startDate, endDate, selectedApiName]);

  const loadApiNames = async () => {
    try {
      const names = await fetchUniqueApiNames();
      setApiNamesList(names);
    } catch (error) {
      console.error('Failed to load API names', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Backend expects 1-based page, MUI is 0-based
      const result = await fetchApiLogs(page + 1, rowsPerPage, startDate || undefined, endDate || undefined, selectedApiName || undefined);
      setLogs(result.data);
      setTotalRecords(result.total);
    } catch (error) {
      console.error('Failed to load API logs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedApiName('');
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          API Health Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor the background fetching operations for external APIs.
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 150 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="api-name-select-label">API Name</InputLabel>
            <Select
              labelId="api-name-select-label"
              value={selectedApiName}
              label="API Name"
              onChange={(e) => { setSelectedApiName(e.target.value); setPage(0); }}
            >
              <MenuItem value="">
                <em>All APIs</em>
              </MenuItem>
              {apiNamesList.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={handleClearFilters}
            disabled={!startDate && !endDate && !selectedApiName}
            sx={{ height: 40 }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Table Section */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>API Name</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Endpoint</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No logs found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.apiName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.status} 
                        size="small" 
                        color={log.status === 'SUCCESS' ? 'success' : 'error'} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.endpoint || '-'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.message || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
