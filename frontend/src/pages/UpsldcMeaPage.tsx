import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TablePagination,
  TableSortLabel,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ElectricBolt as BoltIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  HelpOutline as HelpIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export interface UpsldcRecord {
  slNo: number;
  month: string;
  year: number;
  version: string;
  despatchedDate: string;
  pdfUrl: string;
}

export interface UpsldcGenerator {
  genId: string;
  name: string;
  category: string;
  records: UpsldcRecord[];
  totalRecords: number;
  lastTradedMonth: string | null;
  lastTradedYear: number | null;
  lastTradedDate: string | null;
  status: 'TRADING' | 'NOT_TRADING_RECENT' | 'NEVER_TRADED';
  latestPdfUrl: string | null;
  lastUpdated: string;
}

export interface UpsldcSummary {
  totalGenerators: number;
  tradingCount: number;
  notTraded3MonthsCount: number;
  notTradedLastMonthCount: number;
  neverTradedCount: number;
  latestSystemTradedPeriod: string | null;
  scrapeStatus: {
    isRunning: boolean;
    total: number;
    completed: number;
    activeCount: number;
    inactiveCount: number;
    neverTradedCount: number;
    percent: number;
    lastError: string | null;
  };
}

export type StatusFilterType = 'NOT_TRADED_3_MONTHS' | 'ALL' | 'TRADING' | 'NEVER_TRADED';

export default function UpsldcMeaPage() {
  const theme = useTheme();

  // State
  const [generators, setGenerators] = useState<UpsldcGenerator[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<UpsldcSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [syncingGenerators, setSyncingGenerators] = useState(false);
  const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Filters & Pagination - defaults to 'NOT_TRADED_3_MONTHS' as requested
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('NOT_TRADED_3_MONTHS');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setPage(0);
  };

  const handleStatusChange = (newStatus: StatusFilterType) => {
    setStatusFilter(newStatus);
    setPage(0);
  };

  const handleSort = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
    setPage(0);
  };

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get('/upsldc-mea/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // Fetch Generators List
  const fetchGenerators = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter,
        search: debouncedSearch.trim() || undefined,
        sortBy,
        sortOrder
      };

      const res = await apiClient.get('/upsldc-mea/generators', { params });
      if (res.data?.success) {
        setGenerators(res.data.data.data);
        setTotalCount(res.data.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch generators:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchGenerators();
  }, [fetchGenerators]);

  // Sync with live UPSLDC portal
  const handleSyncGenerators = async () => {
    try {
      setSyncingGenerators(true);
      const res = await apiClient.post('/upsldc-mea/sync-generators');
      if (res.data?.success) {
        const newlyAdded = res.data.data?.newlyAdded || 0;
        const total = res.data.data?.total || 615;
        setSyncAlert({
          type: newlyAdded > 0 ? 'success' : 'info',
          text: newlyAdded > 0
            ? `Discovered and registered ${newlyAdded} new customer(s) from UPSLDC! Total now: ${total}.`
            : `UPSLDC portal verified: all ${total} customers are up to date.`
        });
        fetchSummary();
        fetchGenerators();
        setTimeout(() => setSyncAlert(null), 5000);
      }
    } catch (err: any) {
      console.error('Failed to sync generators:', err);
    } finally {
      setSyncingGenerators(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await apiClient.get('/upsldc-mea/export-excel', {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `UPSLDC_OA_MEA_Non_Trading_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting excel:', err);
    } finally {
      setExporting(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'TRADING':
        return (
          <Chip
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16A34A !important' }} />}
            label="Actively Trading"
            sx={{
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              fontWeight: 600,
              fontSize: '12px',
              border: '1px solid #BBF7D0'
            }}
          />
        );
      case 'NOT_TRADING_RECENT':
        return (
          <Chip
            size="small"
            icon={<WarningIcon sx={{ fontSize: '14px !important', color: '#DC2626 !important' }} />}
            label="Not Trading (Recent)"
            sx={{
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              fontWeight: 600,
              fontSize: '12px',
              border: '1px solid #FECACA'
            }}
          />
        );
      case 'NEVER_TRADED':
      default:
        return (
          <Chip
            size="small"
            icon={<HelpIcon sx={{ fontSize: '14px !important', color: '#64748B !important' }} />}
            label="Never Traded"
            sx={{
              backgroundColor: '#F1F5F9',
              color: '#475569',
              fontWeight: 500,
              fontSize: '12px',
              border: '1px solid #E2E8F0'
            }}
          />
        );
    }
  };

  const isFiltersActive = Boolean(search || statusFilter !== 'ALL');

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* 1. Header & Actions */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: alpha('#0284C7', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BoltIcon sx={{ color: '#0284C7', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px' }}>
              UPSLDC Open Access (OA) MEA Monitoring
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', ml: { xs: 0, sm: 6.5 } }}>
            Identify customers who have not traded in recent 3 months from current month ({summary?.latestSystemTradedPeriod || 'Current Month'}).
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={syncingGenerators ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon sx={{ fontSize: 18 }} />}
            disabled={syncingGenerators}
            onClick={handleSyncGenerators}
            sx={{
              borderColor: '#CBD5E1',
              color: '#475569',
              fontWeight: 600,
              '&:hover': { bgcolor: alpha('#64748B', 0.08), borderColor: '#94A3B8' }
            }}
          >
            {syncingGenerators ? 'Checking Portal...' : 'Sync Portal Entities'}
          </Button>

          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
            disabled={exporting}
            onClick={handleExportExcel}
            sx={{
              bgcolor: '#16A34A',
              fontWeight: 600,
              '&:hover': { bgcolor: '#15803D' }
            }}
          >
            {exporting ? 'Generating...' : 'Export to Excel'}
          </Button>

          <Tooltip title="Refresh Table">
            <IconButton onClick={() => { fetchSummary(); fetchGenerators(); }} sx={{ border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <RefreshIcon sx={{ fontSize: 20, color: '#64748B' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Sync Alert Banner */}
      {syncAlert && (
        <Alert
          severity={syncAlert.type}
          onClose={() => setSyncAlert(null)}
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          {syncAlert.text}
        </Alert>
      )}

      {/* 2. KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Total Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={handleResetFilters}
            sx={{
              borderRadius: 3,
              cursor: 'pointer',
              border: statusFilter === 'ALL' && !search ? '2px solid #0284C7' : '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Total Customers
                </Typography>
                <Chip label="All" size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#F1F5F9', color: '#475569' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {summary ? summary.totalGenerators : 615}
              </Typography>
              <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, display: 'block', mt: 0.5 }}>
                Category: Open Access (genCat=7)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Not Traded in Recent 3 Months (Requested Filter) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleStatusChange('NOT_TRADED_3_MONTHS')}
            sx={{
              borderRadius: 3,
              cursor: 'pointer',
              border: statusFilter === 'NOT_TRADED_3_MONTHS' ? '2px solid #DC2626' : '1px solid #FECACA',
              bgcolor: '#FFF5F5',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 700 }}>
                  Not Traded in Recent 3 Months
                </Typography>
                <Chip label="High Priority" size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#DC2626' }}>
                {summary ? summary.notTraded3MonthsCount : 4}
              </Typography>
              <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 600, display: 'block', mt: 0.5 }}>
                Inactive for ≥ 3 Months / Never Traded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Actively Trading */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleStatusChange('TRADING')}
            sx={{
              borderRadius: 3,
              cursor: 'pointer',
              border: statusFilter === 'TRADING' ? '2px solid #16A34A' : '1px solid #BBF7D0',
              bgcolor: '#F0FDF4',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
                  Actively Trading
                </Typography>
                <Chip label="Active" size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#DCFCE7', color: '#15803D' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#16A34A' }}>
                {summary ? summary.tradingCount : 611}
              </Typography>
              <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 500, display: 'block', mt: 0.5 }}>
                Traded within Recent 3 Months
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Automated Schedule */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 16, color: '#475569' }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  Automated Schedule
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                15th & 20th Monthly
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Runs twice/month @ 02:00 AM IST
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Filter Bar - Clean, focused on 3-month filter without extra dropdowns */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search customer name or UPSLDC ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter Customers"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
            >
              <MenuItem value="NOT_TRADED_3_MONTHS" sx={{ color: '#DC2626', fontWeight: 700 }}>
                ⚡ Not Traded in Recent 3 Months ({summary ? summary.notTraded3MonthsCount : 4})
              </MenuItem>
              <MenuItem value="ALL">
                All Customers ({summary ? summary.totalGenerators : 615})
              </MenuItem>
              <MenuItem value="TRADING" sx={{ color: '#15803D' }}>
                ✅ Actively Trading ({summary ? summary.tradingCount : 611})
              </MenuItem>
              <MenuItem value="NEVER_TRADED" sx={{ color: '#64748B' }}>
                ❓ Never Traded ({summary ? summary.neverTradedCount : 2})
              </MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="text"
              size="small"
              disabled={!isFiltersActive}
              onClick={handleResetFilters}
              sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none' }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 4. Data Table - EXACTLY 5 COLUMNS ONLY: S.No., Customer Name, UPSLDC ID, Status, Last Month Traded */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 80, color: '#475569' }}>S.No.</TableCell>
                
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Customer Name
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 140, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'genId'}
                    direction={sortBy === 'genId' ? sortOrder : 'asc'}
                    onClick={() => handleSort('genId')}
                  >
                    UPSLDC ID
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 220, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 220, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'lastTraded'}
                    direction={sortBy === 'lastTraded' ? sortOrder : 'asc'}
                    onClick={() => handleSort('lastTraded')}
                  >
                    Last Month Traded
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                    <CircularProgress size={36} sx={{ color: '#0284C7', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Loading UPSLDC Open Access Data...</Typography>
                  </TableCell>
                </TableRow>
              ) : generators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: '#0F172A', fontWeight: 600, mb: 0.5 }}>
                      No matching customers found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 500, mx: 'auto', mb: 2 }}>
                      No customers matched your filter selection. Try resetting filters to view all customers.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleResetFilters}
                      sx={{ borderColor: '#0284C7', color: '#0284C7', textTransform: 'none', fontWeight: 600 }}
                    >
                      Reset Filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                generators.map((g, idx) => {
                  const slNo = page * rowsPerPage + idx + 1;
                  const isInactive = g.status === 'NOT_TRADING_RECENT' || g.status === 'NEVER_TRADED';
                  const lastTradedStr = g.lastTradedYear && g.lastTradedMonth ? `${g.lastTradedMonth} ${g.lastTradedYear}` : '-';

                  return (
                    <TableRow
                      key={g.genId}
                      hover
                      sx={{
                        bgcolor: isInactive ? alpha('#FEF2F2', 0.5) : 'inherit',
                        '&:hover': { bgcolor: isInactive ? '#FEE2E2 !important' : '#F8FAFC !important' }
                      }}
                    >
                      {/* 1. S.No. */}
                      <TableCell sx={{ color: '#64748B' }}>{slNo}</TableCell>
                      
                      {/* 2. Customer Name */}
                      <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {g.name}
                      </TableCell>
                      
                      {/* 3. UPSLDC ID */}
                      <TableCell>
                        <Chip label={g.genId} size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 600, color: '#334155' }} />
                      </TableCell>
                      
                      {/* 4. Status */}
                      <TableCell>{getStatusChip(g.status)}</TableCell>
                      
                      {/* 5. Last Month Traded */}
                      <TableCell>
                        {g.lastTradedMonth ? (
                          <Chip
                            label={lastTradedStr}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: isInactive ? '#FEE2E2' : '#EFF6FF',
                              color: isInactive ? '#B91C1C' : '#1D4ED8',
                              border: isInactive ? '1px solid #FECACA' : '1px solid #BFDBFE'
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                            Never Traded
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[25, 50, 100, 250]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}
