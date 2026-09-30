import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Bolt as BoltIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  UploadFile as UploadFileIcon,
  Add as AddIcon,
  WarningAmber as WarningIcon,
  AccountBalance as AccountBalanceIcon,
  Speed as SpeedIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  fetchDailyConsumers,
  saveDailyConsumer,
  uploadDailyTradeReportPdfs,
  fetchDailyAnalysis,
  DailyConsumer,
  DailyAnalysisResponse
} from '../api/traderPerformanceDaily.api';

export default function TraderPerformanceDailyPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // State variables
  const [consumers, setConsumers] = useState<DailyConsumer[]>([]);
  const [selectedConsumerId, setSelectedConsumerId] = useState<string>('poorvanchal-default');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [selectedTargetDate, setSelectedTargetDate] = useState<string>(getTodayDate());

  const [analysisData, setAnalysisData] = useState<DailyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  // PDF Upload State
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Consumer Modal State
  const [newConsumerDialogOpen, setNewConsumerDialogOpen] = useState<boolean>(false);
  const [newConsumerForm, setNewConsumerForm] = useState({
    name: '',
    discom: 'PUVVNL',
    stateCode: 'UP',
    consumerCategory: 'HV-2 | Urban Schedule (Large & Heavy Power)',
    voltageLevel: '11 kV',
    sanctionedLoadKw: 1000,
    powerFactor: 0.99,
    discomBaseTariff: 7.65
  });

  // Load consumers list
  const loadConsumers = async () => {
    try {
      const list = await fetchDailyConsumers();
      setConsumers(list);
      if (list.length > 0 && !selectedConsumerId) {
        setSelectedConsumerId(list[0].id);
      }
    } catch (err) {
      console.warn('Could not load consumers:', err);
    }
  };

  // Fetch calculation analysis
  const loadAnalysis = async (tradeReports?: any) => {
    setLoading(true);
    try {
      const data = await fetchDailyAnalysis({
        consumerId: selectedConsumerId,
        monthStr: selectedMonth,
        targetDate: selectedTargetDate,
        tradeReports
      });
      setAnalysisData(data);
      if (data && data.targetDate) {
        setSelectedTargetDate(data.targetDate);
      }
    } catch (err: any) {
      console.error('Failed to load daily analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsumers();
  }, []);

  useEffect(() => {
    loadAnalysis();
  }, [selectedConsumerId, selectedMonth, selectedTargetDate]);

  // Handle Trade PDF Upload
  const handlePdfUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadDailyTradeReportPdfs(selectedFiles);
      setUploadResult(result);
      // Re-run analysis with newly parsed reports
      await loadAnalysis(result);
      setSelectedFiles([]);
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadResult(null);
      }, 1800);
    } catch (err: any) {
      console.error('PDF Upload Error:', err);
      setUploadError(err.response?.data?.message || err.message || 'Failed to parse trade PDFs');
    } finally {
      setUploading(false);
    }
  };

  // Handle saving new onboarded consumer
  const handleSaveNewConsumer = async () => {
    if (!newConsumerForm.name.trim()) return;
    try {
      const saved = await saveDailyConsumer({
        name: newConsumerForm.name,
        discom: newConsumerForm.discom,
        stateCode: newConsumerForm.stateCode,
        consumerCategory: newConsumerForm.consumerCategory,
        voltageLevel: newConsumerForm.voltageLevel,
        sanctionedLoadKw: Number(newConsumerForm.sanctionedLoadKw) || 1000,
        powerFactor: Number(newConsumerForm.powerFactor) || 0.99,
        discomBaseTariff: Number(newConsumerForm.discomBaseTariff) || 7.65
      });
      setNewConsumerDialogOpen(false);
      await loadConsumers();
      setSelectedConsumerId(saved.id);
    } catch (err) {
      console.error('Failed to save consumer:', err);
    }
  };

  const summary = analysisData?.summary;
  const consumer = analysisData?.consumer;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 5 }}>
      {/* Top Banner / Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h1" sx={{ fontSize: '1.45rem', fontWeight: 700, color: 'text.primary' }}>
                Trader Performance Daily
              </Typography>
              <Chip
                label="Daily & MTD Tracking"
                size="small"
                sx={{
                  bgcolor: alpha('#2E51FF', 0.1),
                  color: '#2E51FF',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
              {consumer && (
                <Chip
                  label={`Consumer: ${consumer.name}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'divider', fontWeight: 500, fontSize: '0.75rem' }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Compare actual savings from uploaded trade reports against potential savings with Probus Savings Calc.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              fontWeight: 600,
              bgcolor: alpha('#8B5CF6', 0.04),
              '&:hover': { borderColor: '#7C3AED', bgcolor: alpha('#8B5CF6', 0.1) }
            }}
          >
            Upload Trade PDFs
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewConsumerDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#10B981',
              color: 'white',
              fontWeight: 600,
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            Add Consumer
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadAnalysis()}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.primary'
            }}
          >
            Sync
          </Button>
        </Box>
      </Box>

      {/* Filter / Selector Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
            <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Parameters:
            </Typography>
          </Box>

          <TextField
            select
            label="Consumer / Entity"
            size="small"
            value={selectedConsumerId}
            onChange={(e) => setSelectedConsumerId(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            {consumers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({c.discom}, {c.stateCode})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="month"
            label="Billing Month"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <TextField
            type="date"
            label="Target Date Breakdown"
            size="small"
            value={selectedTargetDate}
            onChange={(e) => setSelectedTargetDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
        </Box>

        {summary && summary.uploadedReportsCount > 0 && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            label={`${summary.uploadedReportsCount} Trade Report(s) Analyzed`}
            color="success"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Paper>

      {/* HERO COMPARISON CALLOUT BANNER */}
      {summary && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Box sx={{ p: 2, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SpeedIcon sx={{ color: '#F59E0B' }} />
                <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.1em' }}>
                  MONTH-TILL-DATE SAVINGS COMPARISON ({selectedMonth})
                </Typography>
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.4, mb: 2 }}>
                In this month till now, you would have saved{' '}
                <Box component="span" sx={{ color: '#10B981', textDecoration: 'underline' }}>
                  ₹ {summary.mtdProbusSavings.toLocaleString('en-IN')}
                </Box>{' '}
                using our Savings Calculator.
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      POTENTIAL WITH SAVINGS CALC
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#10B981', fontWeight: 700, mt: 0.5 }}>
                      ₹ {summary.mtdProbusSavings.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      Effective: ₹ {summary.avgProbusEffectiveRate.toFixed(2)} / kWh
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      ACTUAL SAVINGS (UPLOADED PDFs)
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#38BDF8', fontWeight: 700, mt: 0.5 }}>
                      ₹ {summary.mtdActualTraderSavings.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      Effective: ₹ {summary.avgActualTraderRate.toFixed(2)} / kWh
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(244,63,94,0.1)', borderRadius: 2, border: '1px solid rgba(244,63,94,0.2)' }}>
                    <Typography variant="caption" sx={{ color: '#FDA4AF', fontWeight: 600 }}>
                      EXTRA SAVINGS MISSED / OPPORTUNITY
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#FB7185', fontWeight: 700, mt: 0.5 }}>
                      ₹ {summary.mtdOpportunityLoss.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FECDD3' }}>
                      Additional profit left on table
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Paper>
      )}

      {/* KPI Summary Cards */}
      {summary && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#2E51FF', 0.1), color: '#2E51FF' }}>
                  <BoltIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    MTD Total Consumption
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    {(summary.mtdConsumptionKwh / 1000).toFixed(1)} MWh
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {summary.mtdConsumptionKwh.toLocaleString('en-IN')} kWh metered
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#10B981', 0.1), color: '#10B981' }}>
                  <CurrencyRupeeIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Baseline Discom Cost
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    ₹ {Math.round(summary.mtdBaselineDiscomCost / 1000).toLocaleString('en-IN')}k
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Tariff @ ₹{summary.avgBaselineTariff.toFixed(2)}/kWh
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}>
                  <TrendingUpIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Trader Traded Volume
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    {(summary.mtdTradedVolumeKwh / 1000).toFixed(1)} MWh
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    From uploaded trade PDFs
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B' }}>
                  <AssessmentIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Rate Arbitrage (Probus vs Trader)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    ₹ {(summary.avgActualTraderRate - summary.avgProbusEffectiveRate).toFixed(2)} / kWh
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cheaper landed cost with Probus
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs & Detailed Breakdown */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Month-to-Date Daily Breakdown" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label={`15-Minute Intervals (${selectedTargetDate})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Calculating daily performance and interval clearing prices...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 0 }}>
            {/* TAB 0: DAY BY DAY MTD BREAKDOWN */}
            {activeTab === 0 && (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Consumption (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Discom Cost (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#10B981' }}>Probus Savings (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#0284C7' }}>Actual Trader Savings (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#E11D48' }}>Opportunity Missed (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Traded Volume (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Probus Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Trader Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysisData?.dailyBreakdown.map((row) => (
                      <TableRow
                        key={row.date}
                        hover
                        selected={row.date === selectedTargetDate}
                        onClick={() => setSelectedTargetDate(row.date)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.date} {row.date === selectedTargetDate && <Chip label="Selected" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} />}
                        </TableCell>
                        <TableCell align="right">{row.consumptionKwh.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹ {row.baselineDiscomCost.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ₹ {row.probusSavings.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#0284C7', fontWeight: 600 }}>
                          ₹ {row.actualTraderSavings.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#E11D48', fontWeight: 600 }}>
                          ₹ {row.opportunityLoss.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">{row.tradedVolumeKwh.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹ {row.avgProbusPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">₹ {row.avgTraderPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 1: 15-MINUTE 96-INTERVAL BREAKDOWN FOR TARGET DATE */}
            {activeTab === 1 && (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Block #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Time Slot</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Load (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Discom (₹/kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>DAM / RTM / GDAM MCP</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Probus Optimal Market</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#10B981' }}>Probus Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Trader Traded (MW)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Trader Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#10B981' }}>Probus Savings (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#E11D48' }}>Extra Savings Possible (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysisData?.intervalBreakdown.map((slot) => (
                      <TableRow key={slot.intervalNumber} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{slot.intervalNumber}</TableCell>
                        <TableCell>{slot.timeBlock}</TableCell>
                        <TableCell align="right">{slot.consumptionKwh.toFixed(1)}</TableCell>
                        <TableCell align="right">₹ {slot.discomRate.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹{slot.damMcp.toFixed(2)} / ₹{slot.rtmMcp.toFixed(2)} / ₹{slot.gdamMcp.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={slot.probusSource}
                            size="small"
                            color={slot.probusSource === 'DISCOM' ? 'default' : 'success'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ₹ {slot.probusRate.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {slot.traderTradedMw > 0 ? `${slot.traderTradedMw.toFixed(2)} MW` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {slot.traderClearedPrice ? `₹ ${slot.traderClearedPrice.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ₹ {slot.probusSavingsVsDiscom}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#E11D48', fontWeight: 600 }}>
                          ₹ {slot.extraSavingsPossible}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* PDF UPLOAD DIALOG */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Daily Trade Report PDFs</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
            Upload IEX Trade Reports (DAM/RTM/GDAM). The system parses trade intervals, cleared volumes, and prices in memory without saving raw PDF files.
          </Alert>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            <input
              type="file"
              multiple
              accept="application/pdf"
              style={{ display: 'none' }}
              id="trade-pdf-upload-input"
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedFiles(Array.from(e.target.files));
                }
              }}
            />
            <label htmlFor="trade-pdf-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
              <UploadFileIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Click to browse or drag & drop trade report PDFs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports multiple DAM / GDAM / RTM trade report files
              </Typography>
            </label>
          </Box>

          {selectedFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Selected Files ({selectedFiles.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 120, overflowY: 'auto' }}>
                {selectedFiles.map((file, idx) => (
                  <Chip key={idx} label={file.name} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {uploading && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
                Parsing trade intervals, extracting cleared volumes & settlement charges...
              </Typography>
            </Box>
          )}

          {uploadResult && (
            <Alert severity="success" icon={<DoneAllIcon fontSize="inherit" />}>
              Successfully parsed and extracted trade data from {Object.keys(uploadResult.data || {}).length} file(s)!
            </Alert>
          )}

          {uploadError && <Alert severity="error">{uploadError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePdfUpload}
            disabled={selectedFiles.length === 0 || uploading}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            {uploading ? 'Processing...' : 'Parse & Extract Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW CONSUMER ONBOARDING DIALOG */}
      <Dialog open={newConsumerDialogOpen} onClose={() => setNewConsumerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Onboard New Consumer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Configure a new customer entity to track daily performance and open access arbitrage.
          </Typography>

          <TextField
            label="Consumer / Client Name"
            size="small"
            required
            fullWidth
            value={newConsumerForm.name}
            onChange={(e) => setNewConsumerForm({ ...newConsumerForm, name: e.target.value })}
            placeholder="e.g. Acme Steels Ltd"
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="State Code"
                size="small"
                fullWidth
                value={newConsumerForm.stateCode}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, stateCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Discom"
                size="small"
                fullWidth
                value={newConsumerForm.discom}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, discom: e.target.value })}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Sanctioned Load (kW)"
                type="number"
                size="small"
                fullWidth
                value={newConsumerForm.sanctionedLoadKw}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, sanctionedLoadKw: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Base Tariff (₹/kWh)"
                type="number"
                size="small"
                fullWidth
                value={newConsumerForm.discomBaseTariff}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, discomBaseTariff: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setNewConsumerDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveNewConsumer}
            disabled={!newConsumerForm.name.trim()}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            Save Consumer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
