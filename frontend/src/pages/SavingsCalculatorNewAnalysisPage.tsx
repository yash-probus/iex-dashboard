import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Box, Typography, Button, TextField, IconButton, Alert, Snackbar,
  Grid, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, MenuItem, Paper, Tooltip as MuiTooltip, Chip, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  LightbulbOutlined as LightbulbIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  ElectricBolt as ElectricBoltIcon,
  Category as CategoryIcon,
  Bolt as BoltIcon,
  Speed as SpeedIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon,
  FileDownload as FileDownloadIcon,
  BarChart as BarChartIcon,
  History as HistoryIcon,
  InfoOutlined as InfoOutlinedIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { SlotWiseMarketHeatmap } from '../components/dashboard/SlotWiseMarketHeatmap';
import { DynamicSlotWiseMarketHeatmap } from '../components/dashboard/DynamicSlotWiseMarketHeatmap';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import EmptyTableState from '../components/dashboard/EmptyTableState';
import { Dashboard } from '../components/dashboard/Dashboard';
import { ProposalDashboardExport } from '../components/dashboard/ProposalDashboardExport';
import { RedesignedSavingsReport } from '../components/savings-assistant/RedesignedSavingsReport';
import {
  fetchSavingsNewEntryById,
  calculateMarketDecisionNew,
  fetchSavingsNewEntries,
  SavingsCalculatorNewEntry,
  MarketDecisionResult,
  exportSavingsExcelNew,
  exportDemandShiftExcelNew
} from '../api/savingsCalculatorNew.api';
import html2canvas from 'html2canvas';
import { exportToCSV } from '../utils/export';
import {
  exportSavingsExcel,
  exportProposalWord,
  exportTechnicalProposalWord,
  exportCommercialProposalWord
} from '../api/savingsCalculator.api';

export default function SavingsCalculatorNewAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [calcEntry, setCalcEntry] = useState<SavingsCalculatorNewEntry | null>(null);
  const [cachedResults, setCachedResults] = useState<Record<string, MarketDecisionResult>>({});
  const [calculating, setCalculating] = useState(false);
  const [clientOverview, setClientOverview] = useState<any | null>(null);
  const [selectedSimMonth, setSelectedSimMonth] = useState<string>('all');
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [dynamicGraphDialogOpen, setDynamicGraphDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isPrintingRedesigned, setIsPrintingRedesigned] = useState(false);

  const marketDecisionResult = cachedResults[selectedSimMonth] || cachedResults['all'] || null;

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-report');
      setIsPrintingRedesigned(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const loadData = async () => {
    if (!id) return;
    setCalculating(true);
    try {
      const entryData = await fetchSavingsNewEntryById(id);
      setCalcEntry(entryData);

      const resultsMap: Record<string, MarketDecisionResult> = {};
      const resAll = await calculateMarketDecisionNew(id, 'all');
      resultsMap['all'] = resAll;

      const months = Object.keys(entryData.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-'));
      const monthlyOverview: any[] = [];

      for (const m of months) {
        try {
          const resM = await calculateMarketDecisionNew(id, m);
          resultsMap[m] = resM;
          monthlyOverview.push({
            month: m,
            totalEnergyKwh: resM.totalEnergyKwh,
            totalMarketEnergyKwh: resM.totalMarketEnergyKwh,
            totalBaselineCost: resM.totalBaselineCost,
            totalOptimizedCost: resM.totalOptimizedCost,
            savings: resM.totalSavings,
            grossSavings: (resM as any).grossSavings ?? resM.oaDetailed?.totals?.grossSavings ?? Math.max(0, resM.totalBaselineCost - resM.totalLandedExchangeCost - resM.totalDiscomAfterProlt)
          });
        } catch (err) {
          console.warn(`Failed to run calculation for month ${m}:`, err);
        }
      }

      setCachedResults(resultsMap);
      setClientOverview({
        clientName: entryData.clientName,
        sanctionedLoadKw: entryData.sanctionedLoadKw,
        totalSavings: resAll.totalSavings,
        months: monthlyOverview
      });
    } catch (err: any) {
      console.error('Failed to load analysis:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to load analysis', severity: 'error' });
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleExportCSV = () => {
    if (!marketDecisionResult || !marketDecisionResult.slotsData) return;
    const exportData = marketDecisionResult.slotsData.map((row) => ({
      'Date': row.date,
      'Timeblock': row.slot,
      'Time': row.timeStr,
      'Custom TOD Window': row.todSlab,
      'DAM MCP (₹/kWh)': row.damLandingPrice ? row.damLandingPrice.toFixed(4) : '-',
      'RTM MCP (₹/kWh)': row.rtmLandingPrice ? row.rtmLandingPrice.toFixed(4) : '-',
      'GDAM MCP (₹/kWh)': row.gdamLandingPrice ? row.gdamLandingPrice.toFixed(4) : '-',
      'Discom Price (₹/kWh)': row.discomLandingPrice ? row.discomLandingPrice.toFixed(4) : '-',
      'Selected Landed Price (₹/kWh)': row.comparedLowestPrice ? row.comparedLowestPrice.toFixed(4) : '-',
      'Selected Source': row.selectedSource,
      'Allocated Energy (kWh)': row.maxEnergyPerSlot ? row.maxEnergyPerSlot.toFixed(2) : '0',
      'Baseline Discom Cost (₹)': row.baselineCost ? Math.round(row.baselineCost) : 0,
      'Optimized Cost (₹)': row.optimizedCost ? Math.round(row.optimizedCost) : 0
    }));

    const clientNameStr = calcEntry?.clientName ? calcEntry.clientName.replace(/\s+/g, '_') : 'client';
    exportToCSV(exportData, `${clientNameStr}_custom_tod_simulation_${selectedSimMonth}.csv`);
  };

  const columns: ColumnDefinition[] = [
    { field: 'date', headerName: 'Date', align: 'center' },
    { field: 'timeStr', headerName: 'Time', align: 'center' },
    { field: 'todSlab', headerName: 'Custom TOD Window', align: 'center' },
    {
      field: 'discomLandingPrice',
      headerName: 'Discom Price (₹/kWh)',
      align: 'center',
      valueFormatter: (v) => typeof v === 'number' ? `₹${v.toFixed(2)}` : '-'
    },
    {
      field: 'comparedLowestPrice',
      headerName: 'Selected Price (₹/kWh)',
      align: 'center',
      valueFormatter: (v) => typeof v === 'number' ? `₹${v.toFixed(2)}` : '-'
    },
    {
      field: 'selectedSource',
      headerName: 'Lowest Source',
      align: 'center',
      renderCell: (row) => (
        <Chip
          label={row.selectedSource}
          size="small"
          color={row.selectedSource === 'DISCOM' ? 'default' : 'success'}
        />
      )
    },
    {
      field: 'maxEnergyPerSlot',
      headerName: 'Energy (kWh)',
      align: 'center',
      valueFormatter: (v) => typeof v === 'number' ? `${v.toFixed(1)} kWh` : '-'
    },
    {
      field: 'baselineCost',
      headerName: 'Discom Cost (₹)',
      align: 'center',
      valueFormatter: (v) => typeof v === 'number' ? `₹${Math.round(v).toLocaleString('en-IN')}` : '-'
    },
    {
      field: 'optimizedCost',
      headerName: 'Optimized Cost (₹)',
      align: 'center',
      valueFormatter: (v) => typeof v === 'number' ? `₹${Math.round(v).toLocaleString('en-IN')}` : '-'
    }
  ];

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '383mm', mx: 'auto', '@media print': { maxWidth: '383mm', p: 0 } }}>
      <Box className="dashboard-content-to-hide">
        {/* Top Header */}
        <Box className="no-print" sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton
            onClick={() => navigate('/savings-calculator-new')}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Savings Analysis for {calcEntry?.clientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              State: {calcEntry?.stateCode} | Discom: {calcEntry?.discom} | Load: {calcEntry?.sanctionedLoadKw ? `${calcEntry.sanctionedLoadKw} kW` : '-'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider', minHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>
          {/* Action Bar */}
          <Box className="no-print" sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={loadData}
              disabled={calculating}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                bgcolor: '#8B5CF6',
                '&:hover': { bgcolor: '#7C3AED' }
              }}
            >
              {calculating ? 'Analyzing...' : 'Refresh Simulation'}
            </Button>

            {selectedSimMonth !== 'all' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<BarChartIcon />}
                  onClick={() => setGraphDialogOpen(true)}
                  disabled={calculating}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    bgcolor: '#F59E0B',
                    '&:hover': { bgcolor: '#D97706' }
                  }}
                >
                  Slot-wise Heatmap
                </Button>

                <Button
                  variant="contained"
                  startIcon={<BarChartIcon />}
                  onClick={() => setDynamicGraphDialogOpen(true)}
                  disabled={calculating}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    bgcolor: '#8B5CF6',
                    '&:hover': { bgcolor: '#7C3AED' }
                  }}
                >
                  Dynamic Heatmap
                </Button>
              </>
            )}

            {/* Month Tabs */}
            <Box className="no-print" sx={{ width: '100%', mt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Tabs
                value={selectedSimMonth}
                onChange={(e, v) => setSelectedSimMonth(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 40, '& .MuiTab-root': { textTransform: 'none', minHeight: 40, fontWeight: 600 } }}
              >
                <Tab label="Overall Summary" value="all" />
                {Object.keys(calcEntry?.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-')).sort().map((ym) => (
                  <Tab
                    key={ym}
                    label={ym}
                    value={ym}
                  />
                ))}
              </Tabs>
            </Box>
          </Box>

          {/* Export Toolbar */}
          {marketDecisionResult && (
            <Box className="no-print" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, my: 2.5, width: '100%' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  color: 'text.primary',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#F8FAFC', borderColor: 'divider' }
                }}
              >
                Export Simulation CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={async () => {
                  if (!id) return;
                  try {
                    await exportSavingsExcelNew(id, selectedSimMonth || undefined, undefined, calcEntry?.clientName);
                  } catch (err: any) {
                    setSnackbar({ open: true, message: err.message || 'Excel export failed', severity: 'error' });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#10B981',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#059669', borderColor: 'divider' }
                }}
              >
                Export Excel (Before TOD Shift)
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={async () => {
                  if (!id) return;
                  try {
                    await exportDemandShiftExcelNew(id, selectedSimMonth || undefined, undefined, calcEntry?.clientName);
                  } catch (err: any) {
                    setSnackbar({ open: true, message: err.message || 'Excel export failed', severity: 'error' });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#0284C7',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#0369A1', borderColor: 'divider' }
                }}
              >
                Export Excel (After TOD Shift)
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const originalTitle = document.title;
                  if (calcEntry?.clientName) {
                    document.title = `${calcEntry.clientName}_Custom_TOD_Savings_Report`;
                  }
                  setIsPrintingRedesigned(true);
                  document.body.classList.add('printing-report');
                  setTimeout(() => {
                    window.print();
                    document.title = originalTitle;
                  }, 500);
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#0F172A',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#1E293B', borderColor: 'divider' }
                }}
              >
                Export PDF Report
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={async () => {
                  if (!calcEntry || !marketDecisionResult) return;
                  try {
                    const totalSavings = marketDecisionResult.totalSavings || 0;
                    const numMonths = Math.max(1, Object.keys(calcEntry.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-')).length || 1);
                    const avgMonthlySavings = Math.round(totalSavings / numMonths);
                    const annualizedSavings = Math.round((totalSavings * 12) / numMonths);
                    const billDateObj = calcEntry.billDate ? new Date(calcEntry.billDate) : new Date();
                    const billMonth = billDateObj.toLocaleString('default', { month: 'long' });
                    const billMonthYear = `${billMonth} ${billDateObj.getFullYear()}`;
                    const currentDate = new Date();
                    const currentMonthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

                    let dashboard_screenshot = "";
                    const dashboardEl = document.getElementById("proposal-export-target-new");
                    if (dashboardEl) {
                      try {
                        const canvas = await html2canvas(dashboardEl, { scale: 2 });
                        dashboard_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                      } catch (e) {
                        console.error("html2canvas error:", e);
                      }
                    }

                    const payload = {
                      ...calcEntry,
                      client_name: calcEntry.clientName,
                      industry_name: calcEntry.industryName,
                      sanctioned_load_kw: calcEntry.sanctionedLoadKw,
                      state_code: calcEntry.stateCode,
                      dashboard_screenshot,
                      totalSavings: annualizedSavings.toLocaleString('en-IN'),
                      monthlySavings: avgMonthlySavings.toLocaleString('en-IN'),
                      billMonth,
                      billMonthYear,
                      currentMonthYear,
                      probusPlatformFee: calcEntry.probusPlatformFee || 150000
                    };
                    await exportProposalWord(payload);
                  } catch (err: any) {
                    setSnackbar({ open: true, message: err.message || 'Proposal export failed', severity: 'error' });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#7C3AED',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#6D28D9', borderColor: 'divider' }
                }}
              >
                Draft Proposal
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={async () => {
                  if (!calcEntry || !marketDecisionResult) return;
                  try {
                    const totalSavings = marketDecisionResult.totalSavings || 0;
                    const numMonths = Math.max(1, Object.keys(calcEntry.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-')).length || 1);
                    const avgMonthlySavings = Math.round(totalSavings / numMonths);
                    const annualizedSavings = Math.round((totalSavings * 12) / numMonths);
                    const billDateObj = calcEntry.billDate ? new Date(calcEntry.billDate) : new Date();
                    const billMonth = billDateObj.toLocaleString('default', { month: 'long' });
                    const billMonthYear = `${billMonth} ${billDateObj.getFullYear()}`;
                    const currentDate = new Date();
                    const currentMonthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

                    let dashboard_screenshot = "";
                    const dashboardEl = document.getElementById("proposal-export-target-new");
                    if (dashboardEl) {
                      try {
                        const canvas = await html2canvas(dashboardEl, { scale: 2 });
                        dashboard_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                      } catch (e) {
                        console.error("html2canvas error:", e);
                      }
                    }

                    const payload = {
                      ...calcEntry,
                      client_name: calcEntry.clientName,
                      industry_name: calcEntry.industryName,
                      sanctioned_load_kw: calcEntry.sanctionedLoadKw,
                      state_code: calcEntry.stateCode,
                      dashboard_screenshot,
                      totalSavings: annualizedSavings.toLocaleString('en-IN'),
                      monthlySavings: avgMonthlySavings.toLocaleString('en-IN'),
                      billMonth,
                      billMonthYear,
                      currentMonthYear,
                      probusPlatformFee: calcEntry.probusPlatformFee || 150000
                    };
                    await exportTechnicalProposalWord(payload);
                  } catch (err: any) {
                    setSnackbar({ open: true, message: err.message || 'Technical proposal export failed', severity: 'error' });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#1D4ED8', borderColor: 'divider' }
                }}
              >
                Technical Proposal
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={async () => {
                  if (!calcEntry || !marketDecisionResult) return;
                  try {
                    const totalSavings = marketDecisionResult.totalSavings || 0;
                    const numMonths = Math.max(1, Object.keys(calcEntry.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-')).length || 1);
                    const avgMonthlySavings = Math.round(totalSavings / numMonths);
                    const annualizedSavings = Math.round((totalSavings * 12) / numMonths);
                    const billDateObj = calcEntry.billDate ? new Date(calcEntry.billDate) : new Date();
                    const billMonth = billDateObj.toLocaleString('default', { month: 'long' });
                    const billMonthYear = `${billMonth} ${billDateObj.getFullYear()}`;
                    const currentDate = new Date();
                    const currentMonthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

                    let dashboard_screenshot = "";
                    const dashboardEl = document.getElementById("proposal-export-target-new");
                    if (dashboardEl) {
                      try {
                        const canvas = await html2canvas(dashboardEl, { scale: 2 });
                        dashboard_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                      } catch (e) {
                        console.error("html2canvas error:", e);
                      }
                    }

                    const payload = {
                      ...calcEntry,
                      client_name: calcEntry.clientName,
                      industry_name: calcEntry.industryName,
                      sanctioned_load_kw: calcEntry.sanctionedLoadKw,
                      state_code: calcEntry.stateCode,
                      dashboard_screenshot,
                      totalSavings: annualizedSavings.toLocaleString('en-IN'),
                      monthlySavings: avgMonthlySavings.toLocaleString('en-IN'),
                      billMonth,
                      billMonthYear,
                      currentMonthYear,
                      probusPlatformFee: calcEntry.probusPlatformFee || 150000
                    };
                    await exportCommercialProposalWord(payload);
                  } catch (err: any) {
                    setSnackbar({ open: true, message: err.message || 'Commercial proposal export failed', severity: 'error' });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#D97706',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#B45309', borderColor: 'divider' }
                }}
              >
                Commercial Proposal
              </Button>
            </Box>
          )}

          {calculating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} />
              <Typography variant="body2" color="text.secondary">
                Running custom TOD cost simulations and analyzing 15-minute slot metrics...
              </Typography>
            </Box>
          )}

          {/* Render Full Dashboard Component */}
          {marketDecisionResult && !calculating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box id="dashboard-screenshot-target" sx={{ mt: 1, bgcolor: '#F8FAFC', p: 2, borderRadius: 2 }}>
                <Dashboard
                  calcResult={marketDecisionResult}
                  calcEntry={calcEntry as any}
                  clientName={calcEntry?.clientName}
                  clientOverview={clientOverview}
                  marketDecisionResult={marketDecisionResult}
                  selectedMonth={selectedSimMonth}
                />
              </Box>

              {/* 15-Minute Interval Sourcing Detail Table */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1E293B' }}>
                  15-Minute Interval Landed Cost & Sourcing Table ({selectedSimMonth})
                </Typography>
                <TableContainer columns={columns} data={marketDecisionResult.slotsData || []} />
              </Paper>

              <div id="proposal-export-target-new" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1200px' }}>
                <ProposalDashboardExport 
                  clientOverview={clientOverview} 
                  marketDecisionResult={marketDecisionResult} 
                  demandShiftInsights={null} 
                  selectedMonth={selectedSimMonth} 
                />
              </div>
            </Box>
          )}
        </Box>

        {/* Heatmap Dialogs */}
        <Dialog
          open={graphDialogOpen}
          onClose={() => setGraphDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
            Slot-wise Market Simulation
            <IconButton onClick={() => setGraphDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {marketDecisionResult && (
              <SlotWiseMarketHeatmap slotsData={marketDecisionResult.slotsData} />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={dynamicGraphDialogOpen}
          onClose={() => setDynamicGraphDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
            Dynamic Slot-wise Market Simulation
            <IconButton onClick={() => setDynamicGraphDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {marketDecisionResult && (
              <DynamicSlotWiseMarketHeatmap slotsData={marketDecisionResult.slotsData} />
            )}
          </DialogContent>
        </Dialog>
      </Box>

      {/* Hidden PDF Report component rendered via Portal for high-res printing */}
      {isPrintingRedesigned && calcEntry && Object.keys(cachedResults).length > 0 && createPortal(
        <Box className="print-container">
          <RedesignedSavingsReport
            calcEntry={calcEntry}
            allResults={Object.keys(cachedResults).map(m => ({ month: m, marketDecisionResult: cachedResults[m] }))}
          />
        </Box>,
        document.body
      )}

      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
