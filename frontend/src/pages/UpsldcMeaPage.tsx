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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  LinearProgress,
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
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PdfIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  FilterList as FilterListIcon
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
  notTradedLastMonthCount: number;
  notTradingRecentCount: number;
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

export type StatusFilterType = 'ALL' | 'NOT_TRADED_LAST_MONTH' | 'NOT_TRADING_RECENT' | 'TRADING' | 'NEVER_TRADED';

const MONTHS = ['ALL', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const YEARS = ['ALL', '2026', '2025', '2024'];

export default function UpsldcMeaPage() {
  const theme = useTheme();

  // State
  const [generators, setGenerators] = useState<UpsldcGenerator[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<UpsldcSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // History Dialog State
  const [selectedGen, setSelectedGen] = useState<UpsldcGenerator | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Scraper Progress Dialog State
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<any>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input to avoid spamming backend on every keypress
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Filter handlers with smart interlocking
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setYearFilter('ALL');
    setMonthFilter('ALL');
    setPage(0);
  };

  const handleStatusChange = (newStatus: StatusFilterType) => {
    setStatusFilter(newStatus);
    if (newStatus === 'NEVER_TRADED' || newStatus === 'NOT_TRADED_LAST_MONTH') {
      setYearFilter('ALL');
      setMonthFilter('ALL');
    }
    setPage(0);
  };

  const handleYearChange = (newYear: string) => {
    setYearFilter(newYear);
    if ((statusFilter === 'NEVER_TRADED' || statusFilter === 'NOT_TRADED_LAST_MONTH') && newYear !== 'ALL') {
      setStatusFilter('ALL');
    }
    setPage(0);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonthFilter(newMonth);
    if ((statusFilter === 'NEVER_TRADED' || statusFilter === 'NOT_TRADED_LAST_MONTH') && newMonth !== 'ALL') {
      setStatusFilter('ALL');
    }
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
        year: yearFilter !== 'ALL' ? yearFilter : undefined,
        month: monthFilter !== 'ALL' ? monthFilter : undefined,
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
  }, [page, rowsPerPage, statusFilter, debouncedSearch, yearFilter, monthFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchGenerators();
  }, [fetchGenerators]);

  // Handle Live Scraping Status Polling
  const checkScrapeStatus = useCallback(async () => {
    try {
      const res = await apiClient.get('/upsldc-mea/scrape/status');
      if (res.data?.success) {
        const s = res.data.data;
        setScrapeStatus(s);
        if (!s.isRunning) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          fetchSummary();
          fetchGenerators();
        }
      }
    } catch (err) {
      console.error('Error polling scrape status:', err);
    }
  }, [fetchSummary, fetchGenerators]);

  const handleTriggerScrape = async () => {
    try {
      setScrapeDialogOpen(true);
      await apiClient.post('/upsldc-mea/scrape');
      checkScrapeStatus();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(checkScrapeStatus, 2000);
    } catch (err: any) {
      console.error('Failed to trigger scrape:', err);
      checkScrapeStatus();
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

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

  // Open History modal
  const handleOpenHistory = (gen: UpsldcGenerator) => {
    setSelectedGen(gen);
    setHistoryOpen(true);
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

  const isFiltersActive = Boolean(search || statusFilter !== 'ALL' || yearFilter !== 'ALL' || monthFilter !== 'ALL');

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
            Automated monitoring of Monthly Energy Accounts (MEA) for UP Open Access generators. Easily identify entities not trading in recent months.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<PlayIcon />}
            onClick={handleTriggerScrape}
            sx={{
              borderColor: '#0284C7',
              color: '#0284C7',
              fontWeight: 600,
              '&:hover': { bgcolor: alpha('#0284C7', 0.08), borderColor: '#0284C7' }
            }}
          >
            Run Scraper Now
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

      {/* 2. KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Total OA Entities */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={handleResetFilters}
            sx={{
              borderRadius: 3,
              cursor: 'pointer',
              border: statusFilter === 'ALL' && yearFilter === 'ALL' && monthFilter === 'ALL' && !search ? '2px solid #0284C7' : '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Total OA Entities
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

        {/* Card 2: Not Traded in Last Month (Top Focus) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleStatusChange('NOT_TRADED_LAST_MONTH')}
            sx={{
              borderRadius: 3,
              cursor: 'pointer',
              border: statusFilter === 'NOT_TRADED_LAST_MONTH' ? '2px solid #DC2626' : '1px solid #FECACA',
              bgcolor: '#FFF5F5',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 700 }}>
                  Not Traded in Last Month
                </Typography>
                <Chip label="High Priority" size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#DC2626' }}>
                {summary ? summary.notTradedLastMonthCount : 5}
              </Typography>
              <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 600, display: 'block', mt: 0.5 }}>
                Missed {summary?.latestSystemTradedPeriod || 'Latest Month'} Billing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Actively Traded */}
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
                  Actively Traded (Last Month)
                </Typography>
                <Chip label="Active" size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#DCFCE7', color: '#15803D' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#16A34A' }}>
                {summary ? summary.tradingCount : 610}
              </Typography>
              <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 500, display: 'block', mt: 0.5 }}>
                Latest Published: {summary?.latestSystemTradedPeriod || 'SEP 2026'}
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

      {/* 3. Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search generator name or ID..."
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

          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trading Status"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
            >
              <MenuItem value="ALL">All Statuses ({summary?.totalGenerators || 615})</MenuItem>
              <MenuItem value="NOT_TRADED_LAST_MONTH" sx={{ color: '#DC2626', fontWeight: 700 }}>
                ⚡ Not Traded in Last Month ({summary?.notTradedLastMonthCount || 5})
              </MenuItem>
              <MenuItem value="NOT_TRADING_RECENT" sx={{ color: '#B91C1C' }}>
                ⚠️ Not Trading in Recent Months ({summary?.notTradingRecentCount || 3})
              </MenuItem>
              <MenuItem value="TRADING" sx={{ color: '#15803D' }}>
                ✅ Actively Trading ({summary?.tradingCount || 610})
              </MenuItem>
              <MenuItem value="NEVER_TRADED" sx={{ color: '#64748B' }}>
                ❓ Never Traded ({summary?.neverTradedCount || 2})
              </MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Last Traded Year"
              value={yearFilter}
              disabled={statusFilter === 'NEVER_TRADED' || statusFilter === 'NOT_TRADED_LAST_MONTH'}
              onChange={(e) => handleYearChange(e.target.value)}
              helperText={
                statusFilter === 'NEVER_TRADED' || statusFilter === 'NOT_TRADED_LAST_MONTH'
                  ? 'N/A for Non-Trading filter'
                  : undefined
              }
            >
              {YEARS.map(yr => (
                <MenuItem key={yr} value={yr}>{yr === 'ALL' ? 'All Years' : yr}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Last Traded Month"
              value={monthFilter}
              disabled={statusFilter === 'NEVER_TRADED' || statusFilter === 'NOT_TRADED_LAST_MONTH'}
              onChange={(e) => handleMonthChange(e.target.value)}
              helperText={
                statusFilter === 'NEVER_TRADED' || statusFilter === 'NOT_TRADED_LAST_MONTH'
                  ? 'N/A for Non-Trading filter'
                  : undefined
              }
            >
              {MONTHS.map(m => (
                <MenuItem key={m} value={m}>{m === 'ALL' ? 'All Months' : m}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={1.5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* 4. Data Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 70, color: '#475569' }}>Sl. No.</TableCell>
                
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Generator / Consumer Name
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 120, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'genId'}
                    direction={sortBy === 'genId' ? sortOrder : 'asc'}
                    onClick={() => handleSort('genId')}
                  >
                    UPSLDC ID
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 180, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 180, color: '#475569' }}>
                  <TableSortLabel
                    active={sortBy === 'lastTraded'}
                    direction={sortBy === 'lastTraded' ? sortOrder : 'asc'}
                    onClick={() => handleSort('lastTraded')}
                  >
                    Last Month Traded
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 170, color: '#475569' }}>Bill Despatched Date</TableCell>

                <TableCell sx={{ fontWeight: 700, width: 130, color: '#475569', textAlign: 'center' }}>
                  <TableSortLabel
                    active={sortBy === 'totalRecords'}
                    direction={sortBy === 'totalRecords' ? sortOrder : 'asc'}
                    onClick={() => handleSort('totalRecords')}
                  >
                    Total Bills
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, width: 160, color: '#475569', textAlign: 'center' }}>Latest MEA PDF</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120, color: '#475569', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center' }}>
                    <CircularProgress size={36} sx={{ color: '#0284C7', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>Loading UPSLDC Open Access Data...</Typography>
                  </TableCell>
                </TableRow>
              ) : generators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: '#0F172A', fontWeight: 600, mb: 0.5 }}>
                      No matching generators found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 500, mx: 'auto', mb: 2 }}>
                      {statusFilter === 'NEVER_TRADED' && (yearFilter !== 'ALL' || monthFilter !== 'ALL')
                        ? 'Never-traded entities have no trading history. Please set Year and Month to "All" to view them.'
                        : 'No generators matched your current filter selection. Try clearing filters or searching a different name.'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleResetFilters}
                      sx={{ borderColor: '#0284C7', color: '#0284C7', textTransform: 'none', fontWeight: 600 }}
                    >
                      Reset All Filters
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
                      <TableCell sx={{ color: '#64748B' }}>{slNo}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {g.name}
                      </TableCell>
                      <TableCell>
                        <Chip label={g.genId} size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 600, color: '#334155' }} />
                      </TableCell>
                      <TableCell>{getStatusChip(g.status)}</TableCell>
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
                      <TableCell sx={{ color: '#475569', fontSize: '13px' }}>
                        {g.lastTradedDate || '-'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                        {g.totalRecords || 0}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {g.latestPdfUrl ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PdfIcon sx={{ color: '#DC2626' }} />}
                            href={g.latestPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: '11px',
                              py: 0.4,
                              px: 1.2,
                              borderColor: '#E2E8F0',
                              color: '#334155',
                              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                            }}
                          >
                            View PDF
                          </Button>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>No PDF</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="View all energy accounts for this entity">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenHistory(g)}
                            sx={{ color: '#0284C7', bgcolor: alpha('#0284C7', 0.08), '&:hover': { bgcolor: alpha('#0284C7', 0.16) } }}
                          >
                            <HistoryIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
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

      {/* 5. Historical Records Dialog */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {selectedGen?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                UPSLDC Generator ID: {selectedGen?.genId} | Total Published MEAs: {selectedGen?.records.length || 0}
              </Typography>
            </Box>
            {selectedGen && getStatusChip(selectedGen.status)}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {selectedGen?.records && selectedGen.records.length > 0 ? (
            <TableContainer sx={{ maxHeight: 450 }}>
              <Table stickyHeader size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Month & Year</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Bill Despatched Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Download MEA Report</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedGen.records.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {r.month} {r.year}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip label={`v${r.version || '1'}`} size="small" sx={{ height: 20, fontSize: 11 }} />
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>
                        {r.despatchedDate || '-'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {r.pdfUrl ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
                            href={r.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontSize: '11px', py: 0.2 }}
                          >
                            Open PDF
                          </Button>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>Not available</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 600 }}>No MEA records found</Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>This entity has not filed energy accounting bills on UPSLDC yet.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryOpen(false)} sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. Live Scraper Progress Dialog */}
      <Dialog
        open={scrapeDialogOpen}
        onClose={() => {
          if (!scrapeStatus?.isRunning) setScrapeDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          UPSLDC Scraper Status
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {scrapeStatus?.isRunning ? (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284C7' }}>
                  Scraping Open Access Generators...
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {scrapeStatus.percent || 0}% ({scrapeStatus.completed || 0}/{scrapeStatus.total || 615})
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={scrapeStatus.percent || 0}
                sx={{ height: 8, borderRadius: 4, mb: 2, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#0284C7' } }}
              />
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                Iterating all 615 Open Access entities one by one and checking Monthly Energy Account bills on UPSLDC. This runs in the background.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                Scraping completed! Results have been updated.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F8FAFC' }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Total Processed</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{summary?.totalGenerators || 615}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F0FDF4' }}>
                    <Typography variant="caption" sx={{ color: '#166534' }}>Actively Trading</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#16A34A' }}>{summary?.tradingCount ?? 610}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FEF2F2' }}>
                    <Typography variant="caption" sx={{ color: '#991B1B' }}>Not Trading</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC2626' }}>{summary?.notTradedLastMonthCount ?? 5}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setScrapeDialogOpen(false)}
            variant="contained"
            disabled={scrapeStatus?.isRunning}
            sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' } }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
