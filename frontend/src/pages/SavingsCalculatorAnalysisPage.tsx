import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { FormControlLabel, Switch, 
  Box, Typography, Button, alpha, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton, Alert, Snackbar,
  Grid, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, MenuItem, Paper, Tooltip as MuiTooltip, InputAdornment, OutlinedInput
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
import { SlotWiseMarketHeatmap } from '../components/dashboard/SlotWiseMarketHeatmap';
import { DynamicSlotWiseMarketHeatmap } from '../components/dashboard/DynamicSlotWiseMarketHeatmap';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import EmptyTableState from '../components/dashboard/EmptyTableState';
import { Dashboard } from '../components/dashboard/Dashboard';
import { ProposalDashboardExport } from '../components/dashboard/ProposalDashboardExport';
import { 
  fetchSavingsEntries, 
  createSavingsEntry, 
  updateSavingsEntry, 
  deleteSavingsEntry, 
  calculateSavings,
  calculateMarketDecision,
  SavingsCalculatorEntry, 
  CalculationResult,
  CalculationSlotDetail,
  MarketDecisionResult,
  exportSavingsExcel,
  exportDemandShiftExcel,
  fetchDemandShiftInsights,
  DemandShiftInsightsResult,
  fetchEntryHistory,
  fetchClientOverview,
  ClientOverviewResult,
  exportProposalWord,
  exportTechnicalProposalWord,
  exportCommercialProposalWord
} from '../api/savingsCalculator.api';
import { hardcodedPayload } from '../utils/hardcodedPayload';

import EnergyInsightsExplorer from '../components/insights/EnergyInsightsExplorer';
import { exportToCSV } from '../utils/export';
import { RedesignedSavingsReport } from '../components/savings-assistant/RedesignedSavingsReport';
import { getResourceData } from '../api/resourceCenter.api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { numberToIndianWords } from '../utils/numberToIndianWords';
import html2canvas from 'html2canvas';

export default function SavingsCalculatorAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  const [calcEntry, setCalcEntry] = useState<SavingsCalculatorEntry | null>(null);
  const [cachedResults, setCachedResults] = useState<Record<string, { calc: CalculationResult | null, market: MarketDecisionResult | null, insights: DemandShiftInsightsResult | null }>>({});
  const [calculating, setCalculating] = useState(false);
  const [clientOverview, setClientOverview] = useState<ClientOverviewResult | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [calculatingInsights, setCalculatingInsights] = useState(false);
  const [calcVersions, setCalcVersions] = useState<number[]>([]);
  const [selectedCalcVersion, setSelectedCalcVersion] = useState<number | ''>('');
  const [calcTab, setCalcTab] = useState(0);
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [demandShiftGraphOpen, setDemandShiftGraphOpen] = useState(false);
  const [dynamicGraphDialogOpen, setDynamicGraphDialogOpen] = useState(false);
  const [dynamicDemandShiftGraphOpen, setDynamicDemandShiftGraphOpen] = useState(false);
  const [marketDecisionOpen, setMarketDecisionOpen] = useState(false);
  const [marketDecisionEntry, setMarketDecisionEntry] = useState<SavingsCalculatorEntry | null>(null);
  const [marketDecisionLoading, setMarketDecisionLoading] = useState(false);
  const [marketVolumeKwh, setMarketVolumeKwh] = useState<string>('15000');
  const [nldcFee, setNldcFee] = useState<string>('5000');
  const [sldcFee, setSldcFee] = useState<string>('1500');
  const [marketMonthStr, setMarketMonthStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedSimMonth, setSelectedSimMonth] = useState<string>('');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isPrintingRedesigned, setIsPrintingRedesigned] = useState(false);
  
  const calcResult = cachedResults[selectedSimMonth]?.calc || null;
  const marketDecisionResult = cachedResults[selectedSimMonth]?.market || null;
  const demandShiftInsights = cachedResults[selectedSimMonth]?.insights || null;

  const { firstInsightMonthState, secondInsightMonthState } = useMemo(() => {
    let first = "January 2026";
    let second = "May 2026";
    if (clientOverview && clientOverview.months) {
      const monthlyData = clientOverview.months.map(m => ({
        month_name: m.month || '',
        raw_saving: Math.round(m.savings || 0)
      }));
      const sorted = [...monthlyData].sort((a, b) => b.raw_saving - a.raw_saving);
      if (sorted.length > 0) {
        first = sorted[0].month_name;
        if (sorted.length > 1) {
          second = sorted[1].month_name;
        } else {
          second = sorted[0].month_name;
        }
      }
    }
    return { firstInsightMonthState: first, secondInsightMonthState: second };
  }, [clientOverview]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CHANGE_MONTH' && event.data.month) {
        setSelectedSimMonth(event.data.month);
      }
    };
    window.addEventListener('message', handleMessage);
    
    const onAfterPrint = () => {
      document.body.classList.remove('printing-report');
      setIsPrintingRedesigned(false);
    };
    window.addEventListener('afterprint', onAfterPrint);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  useEffect(() => {
    const loadEntry = async () => {
      try {
        const data = await fetchSavingsEntries();
        const entry = data.find(e => e.id === id);
        if (entry) {
          setCalcEntry(entry);
          
          // Setup versions
          try {
            const history = await fetchEntryHistory(entry.id);
            const versions = history.map(h => h.version).sort((a, b) => b - a);
            setCalcVersions(versions);
            if (versions.length > 0) {
              setSelectedCalcVersion(versions[0]);
            } else {
              setSelectedCalcVersion('');
            }
          } catch (e) {
            console.error('Failed to fetch history', e);
            setCalcVersions([]);
            setSelectedCalcVersion('');
          }
          
          setSelectedSimMonth('all');
          
          setOverviewLoading(true);
          fetchClientOverview(entry.id).then(res => {
            setClientOverview(res);
            setOverviewLoading(false);
          }).catch(err => {
            console.error("Failed to fetch overview", err);
            setOverviewLoading(false);
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (id) loadEntry();
  }, [id]);

  const executeCalculation = async () => {
    if (!calcEntry) return;
    try {
      setCalculating(true);
      const months = ['all', ...Object.keys(calcEntry.todConsumptions || {}).sort()];
      
      const newCache: Record<string, any> = { ...cachedResults };
      
      for (const m of months) {
        const savingsRes = await calculateSavings(calcEntry.id, m, selectedCalcVersion || undefined);
        const marketRes = await calculateMarketDecision(calcEntry.id, m, selectedCalcVersion || undefined);
        const insightsRes = await fetchDemandShiftInsights(calcEntry.id, m, selectedCalcVersion || undefined);
        
        if (!newCache[m]) newCache[m] = { calc: null, market: null, insights: null };
        newCache[m].calc = savingsRes;
        newCache[m].market = marketRes;
        newCache[m].insights = insightsRes;
      }
      
      setCachedResults(newCache);
      setCalcTab(0);
    } catch (err: any) {
      console.error('Calculation failed:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Calculations failed.',
        severity: 'error'
      });
    } finally {
      setCalculating(false);
    }
  };

const executeGraphSimulation = async () => {
    if (!calcEntry) return;
    try {
      setCalculating(true);
      const res = await calculateMarketDecision(calcEntry.id, selectedSimMonth || undefined, selectedCalcVersion || undefined);
      setCachedResults(prev => ({
        ...prev,
        [selectedSimMonth]: {
          ...prev[selectedSimMonth],
          market: res
        }
      }));
      setGraphDialogOpen(true);
    } catch (err: any) {
      console.error('Graph Simulation failed:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Graph calculation failed.',
        severity: 'error'
      });
    } finally {
      setCalculating(false);
    }
  }

const executeInsights = async () => {
    if (!calcEntry) return;
    try {
      setCalculatingInsights(true);
      const months = ['all', ...Object.keys(calcEntry.todConsumptions || {}).sort()];
      
      const newCache: Record<string, any> = { ...cachedResults };
      
      for (const m of months) {
        const res = await fetchDemandShiftInsights(calcEntry.id, m, selectedCalcVersion || undefined);
        if (!newCache[m]) newCache[m] = { calc: null, market: null, insights: null };
        newCache[m].insights = res;
      }
      
      setCachedResults(newCache);
      setCalcTab(4);
    } catch (err: any) {
      console.error('Insights calculation failed:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Insights calculation failed.',
        severity: 'error'
      });
    } finally {
      setCalculatingInsights(false);
    }
  }

const exportCalcToCSV = () => {
    if (!calcResult || !calcResult.sortedMonthlyList) return;
    const exportData = calcResult.sortedMonthlyList.map((row) => ({
      'Date': row.date,
      'Timeblock': row.slot,
      'Time': row.timeStr,
      'TOD Slab': row.todSlab,
      'DAM (Rs/kWh)': row.damLandingPrice.toFixed(4),
      'DISCOM Landing Rate (Rs/kWh)': row.discomLandingPrice.toFixed(4),
      'Compared Lowest Price (Rs/kWh)': row.comparedLowestPrice.toFixed(4),
      'Sourced Energy (kWh)': row.maxEnergyPerSlot.toFixed(2),
      'Optimized Cost (Rs)': row.optimizedCost.toFixed(2),
      'Baseline DISCOM Cost (Rs)': row.baselineCost.toFixed(2),
      'Savings (Rs)': (row.baselineCost - row.optimizedCost).toFixed(2),
      'Market Decision (Yes/No)': row.selectedSource !== 'DISCOM' ? 'Yes' : 'No',
      'Selected Source': row.selectedSource,
      'ISTS Loss (%)': row.istsLoss?.toFixed(4) || '0.0000',
      'STU Loss (%)': row.stuLoss?.toFixed(4) || '0.0000',
      'Wheeling Loss (%)': row.wheelingLoss?.toFixed(4) || '0.0000'
    }));
    
    const filename = `${calcResult.clientName}_savings_report.csv`;
    exportToCSV(exportData, filename);
  }

const exportDetailedOAToCSV = () => {
    if (!marketDecisionResult || !marketDecisionResult.slotsData) return;
    const exportData = marketDecisionResult.slotsData.map((row) => ({
      'Date': row.date,
      'Timeblock': row.timeblock,
      'TOD Slab': row.tod,
      'DAM MCP': row.damMcp?.toFixed(4) || '-',
      'RTM MCP': row.rtmMcp?.toFixed(4) || '-',
      'GDAM MCP': row.gdamMcp?.toFixed(4) || '-',
      'DAM Landing': row.damLanding?.toFixed(4) || '-',
      'RTM Landing': row.rtmLanding?.toFixed(4) || '-',
      'GDAM Landing': row.gdamLanding?.toFixed(4) || '-',
      'DISCOM Landing': row.discomLanding?.toFixed(4) || '-',
      'Best Market Source': row.marketSource,
      'Best Market Landing': row.bestMarketLanding?.toFixed(4) || '-',
      'Savings Per Kwh': row.savingsPerKwh?.toFixed(4) || '-',
      'Should Buy Market': row.shouldBuyFromMarket ? 'Yes' : 'No',
      'ISTS Loss (%)': row.istsLoss?.toFixed(4) || '0.0000',
      'STU Loss (%)': row.stuLoss?.toFixed(4) || '0.0000',
      'Wheeling Loss (%)': row.wheelingLoss?.toFixed(4) || '0.0000'
    }));
    
    const filename = `${marketDecisionResult.clientName}_detailed_oa_simulation.csv`;
    exportToCSV(exportData, filename);
  }

const exportInsightsToCSV = () => {
    if (!demandShiftInsights || !demandShiftInsights.slotsData) return;
    const exportData = demandShiftInsights.slotsData.map((row) => ({
      'Date': row.date,
      'Timeblock': row.timeblock,
      'TOD Slab': row.tod,
      'Cost Per Kwh': row.costPerKwh?.toFixed(4) || '-',
      'Original Energy (kWh)': row.originalEnergy?.toFixed(2) || '0.00',
      'New Energy (kWh)': row.newEnergy?.toFixed(2) || '0.00',
      'Original Market Energy (kWh)': (row.marketEnergy - (row.newEnergy - row.originalEnergy))?.toFixed(2) || '0.00',
      'New Market Energy (kWh)': row.marketEnergy?.toFixed(2) || '0.00',
      'Discom Energy (kWh)': row.discomEnergy?.toFixed(2) || '0.00',
      'Market Source': row.marketSource || 'DISCOM',
      'Should Buy Market': row.shouldBuyFromMarket ? 'Yes' : 'No'
    }));
    
    const filename = `${demandShiftInsights.clientName}_industry_insights.csv`;
    exportToCSV(exportData, filename);
  }

const exportInsightsToExcel = async () => {
    if (!calcEntry) return;
    try {
      setCalculatingInsights(true);
      await exportDemandShiftExcel(calcEntry.id, selectedSimMonth || undefined, selectedCalcVersion || undefined);
    } catch (error) {
      console.error('Failed to export Demand Shift Insights to Excel', error);
      setSnackbar({
        open: true,
        message: 'Failed to export Insights to Excel. Please try again.',
        severity: 'error'
      });
    } finally {
      setCalculatingInsights(false);
    }
  }


  if (insightsOpen && calcEntry) {
    return <EnergyInsightsExplorer entry={calcEntry} onBack={() => setInsightsOpen(false)} />;
  }

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '383mm', mx: 'auto', '@media print': { maxWidth: '383mm', p: 0 } }}>
      <Box className="dashboard-content-to-hide">
      <Box className="no-print" sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton 
          onClick={() => navigate('/savings-calculator')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Savings Analysis for {calcEntry?.clientName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<LightbulbIcon />}
          onClick={() => setInsightsOpen(true)}
          sx={{ 
            textTransform: 'none', 
            borderRadius: 2, 
            bgcolor: '#16A34A',
            '&:hover': {
              bgcolor: '#15803d'
            }
          }}
        >
          Explore Insights
        </Button>
      </Box>

      <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider', minHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>
        <Box className="no-print" sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
             <TextField
              select
              label="Version"
              value={selectedCalcVersion}
              onChange={(e) => {
                setSelectedCalcVersion(Number(e.target.value));
              }}
              size="small"
              sx={{ width: 120, bgcolor: 'background.paper' }}
            >
              {calcVersions.map((v) => (
                <MenuItem key={v} value={v}>
                  v{v} {v === Math.max(...calcVersions) && '(Recent)'}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={executeCalculation}
              disabled={calculating || calculatingInsights || !selectedSimMonth}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2, 
                bgcolor: '#8B5CF6',
                '&:hover': {
                  bgcolor: '#7C3AED'
                }
              }}
            >
              {calculating ? 'Analyzing...' : 'View'}
            </Button>

            {selectedSimMonth !== 'all' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<BarChartIcon />}
                  onClick={executeGraphSimulation}
                  disabled={calculating || !selectedSimMonth}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 2, 
                    bgcolor: '#F59E0B',
                    '&:hover': {
                      bgcolor: '#D97706'
                    }
                  }}
                >
                  {calculating ? 'Analyzing...' : 'Slot-wise Heatmap'}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<BarChartIcon />}
                  onClick={() => {
                    if (!marketDecisionResult) {
                      executeGraphSimulation();
                      // A bit hacky, but they want it to behave the same
                      setTimeout(() => {
                        setGraphDialogOpen(false);
                        setDynamicGraphDialogOpen(true);
                      }, 1000);
                    } else {
                      setDynamicGraphDialogOpen(true);
                    }
                  }}
                  disabled={calculating || !selectedSimMonth}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 2, 
                    bgcolor: '#8B5CF6',
                    '&:hover': {
                      bgcolor: '#7C3AED'
                    }
                  }}
                >
                  Dynamic Heatmap
                </Button>
              </>
            )}


            {Object.keys(cachedResults).length > 0 && (
              <Box className="no-print" sx={{ width: '100%', mt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={selectedSimMonth} 
                  onChange={(e, v) => setSelectedSimMonth(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: 40, '& .MuiTab-root': { textTransform: 'none', minHeight: 40, fontWeight: 600 } }}
                >
                  <Tab label="Overall" value="all" />
                  {Object.keys(calcEntry?.todConsumptions || {}).sort().map((ym) => (
                    <Tab 
                      key={ym} 
                      label={new Date(`${ym}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })} 
                      value={ym} 
                    />
                  ))}
                </Tabs>
              </Box>
            )}
          </Box>

          {marketDecisionResult && (
            <Box className="no-print" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, my: 2.5, width: '100%' }}>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => {
                  const originalTitle = document.title;
                  if (calcEntry?.clientName) {
                    document.title = `${calcEntry.clientName} - Savings Analysis`;
                  }
                  window.print();
                  document.title = originalTitle;
                }}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2.5, 
                  fontWeight: 600, 
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  color: 'text.primary',
                  px: 2.5,
                  py: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: '#F8FAFC',
                    borderColor: 'divider'
                  }
                }}
              >
                Export as PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={async () => {
                  if (!calcEntry) return;
                  try {
                    const totalSavings = clientOverview?.totalSavings || 0;
                    const numMonths = Math.max(1, clientOverview?.months?.length || 1);
                    const avgMonthlySavings = Math.round(totalSavings / numMonths);
                    const annualizedSavings = Math.round((totalSavings * 12) / numMonths);
                    
                    const billDateObj = calcEntry.billDate ? new Date(calcEntry.billDate) : new Date();
                    const billMonth = billDateObj.toLocaleString('default', { month: 'long' });
                    const billMonthYear = `${billMonth} ${billDateObj.getFullYear()}`;
                    
                    const currentDate = new Date();
                    const currentMonthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
                    
                    const monthsWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
                    const monthsCount = Math.min(12, clientOverview?.months?.length || 0);
                    const monthsCountWord = monthsCount > 0 && monthsCount < monthsWords.length ? monthsWords[monthsCount] : "Six";
                    
                    const monthlyData: any[] = [];
                    if (clientOverview && clientOverview.months) {
                        clientOverview.months.forEach((m) => {
                            const cleared = m.totalMarketEnergyKwh || 0;
                            const consumption = m.totalEnergyKwh || 0;
                            const oaCost = m.totalOptimizedCost || 0;
                            const discomCost = m.totalBaselineCost || 0;
                            const saving = m.savings || 0;
                            
                            const pct = consumption > 0 ? Math.round((cleared / consumption) * 100) : 0;
                            const ppcDiscom = consumption > 0 ? (discomCost / consumption) : 0;
                            const ppcProlt = consumption > 0 ? (oaCost / consumption) : 0;
                            const savingUnit = consumption > 0 ? (saving / consumption) : 0;
                            const reductionPct = discomCost > 0 ? Math.round((saving / discomCost) * 100) : 0;

                            monthlyData.push({
                                month_name: m.month || '',
                                raw_month: m.month ? m.month.split(' ')[0] : '',
                                raw_year: m.month ? m.month.split(' ')[1] : '',
                                cleared: Math.round(cleared).toLocaleString('en-IN'),
                                consumption: Math.round(consumption).toLocaleString('en-IN'),
                                oa_cost: Math.round(oaCost).toLocaleString('en-IN'),
                                discom_cost: Math.round(discomCost).toLocaleString('en-IN'),
                                cleared_pct: `${pct}%`,
                                ppc_discom: `₹${ppcDiscom.toFixed(2)}`,
                                ppc_prolt: `₹${ppcProlt.toFixed(2)}`,
                                saving: `₹${Math.round(saving).toLocaleString('en-IN')}`,
                                raw_saving: Math.round(saving),
                                reduction_pct: reductionPct,
                                saving_unit: `₹${savingUnit.toFixed(2)}`
                            });
                        });
                    }

                    // Sort monthlyData by highest savings to populate insights
                    const sortedForInsights = [...monthlyData].sort((a, b) => b.raw_saving - a.raw_saving);
                    
                    let first_insight_month = "January 2026";
                    let first_insight_month_only = "January";
                    let first_insight_reduction = "17";
                    let first_insight_saving = "2,00,000";
                    let second_insight_month = "May 2026";
                    let second_insight_month_only = "May";

                    if (sortedForInsights.length > 0) {
                        const top1 = sortedForInsights[0];
                        first_insight_month = top1.month_name;
                        first_insight_month_only = top1.raw_month;
                        first_insight_reduction = top1.reduction_pct.toString();
                        first_insight_saving = top1.raw_saving.toLocaleString('en-IN');
                        
                        if (sortedForInsights.length > 1) {
                            const top2 = sortedForInsights[1];
                            second_insight_month = top2.month_name;
                            second_insight_month_only = top2.raw_month;
                        } else {
                            second_insight_month = top1.month_name;
                            second_insight_month_only = top1.raw_month;
                        }
                    }

                    const totalConsumption = clientOverview?.months?.reduce((acc: number, curr: any) => acc + (curr.totalEnergyKwh || 0), 0) || 1;
                    const totalCleared = clientOverview?.months?.reduce((acc: number, curr: any) => acc + (curr.clearedUnitsKwh || curr.oaConsumer || 0), 0) || 0;
                    const procurementPotential = Math.round((totalCleared / totalConsumption) * 100);

                    let dashboard_screenshot = "";
                    const dashboardEl = document.getElementById("proposal-export-target");
                    if (dashboardEl) {
                        try {
                            const canvas = await html2canvas(dashboardEl, { scale: 2 });
                            dashboard_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                        } catch (e) {
                            console.error("html2canvas error:", e);
                        }
                    }

                    let first_insight_screenshot = "";
                    const dashboardEl1 = document.getElementById("proposal-export-target-1");
                    if (dashboardEl1) {
                        try {
                            const canvas = await html2canvas(dashboardEl1, { scale: 2 });
                            first_insight_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                        } catch (e) {
                            console.error("html2canvas error:", e);
                        }
                    }

                    let second_insight_screenshot = "";
                    const dashboardEl2 = document.getElementById("proposal-export-target-2");
                    if (dashboardEl2) {
                        try {
                            const canvas = await html2canvas(dashboardEl2, { scale: 2 });
                            second_insight_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                        } catch (e) {
                            console.error("html2canvas error:", e);
                        }
                    }

                    const payload = {
                      ...hardcodedPayload,
                      ...calcEntry,
                      monthlyData,
                      first_insight_month,
                      first_insight_month_only,
                      first_insight_reduction,
                      first_insight_saving,
                      second_insight_month,
                      second_insight_month_only,
                      months_count_word: monthsCountWord,
                      procurement_potential: procurementPotential,
                      dashboard_screenshot,
                      first_insight_screenshot,
                      second_insight_screenshot,
                      // @ts-ignore
                      savings_in_words: numberToIndianWords ? numberToIndianWords(annualizedSavings) : 'Twenty Five',
                      totalSavings: annualizedSavings.toLocaleString('en-IN'), // Maps to "AVERAGE ANNUAL SAVINGS" in the docx
                      monthlySavings: avgMonthlySavings.toLocaleString('en-IN'), // Maps to "AVERAGE MONTHLY SAVINGS" in the docx
                      paybackDays: 150,
                      billMonth,
                      billMonthYear,
                      currentMonthYear,
                      probusPlatformFee: calcEntry.probusPlatformFee || 150000
                    };
                    await exportTechnicalProposalWord(payload);
                  } catch (err: any) {
                    setSnackbar({
                      open: true,
                      message: err.message || 'Export failed',
                      severity: 'error'
                    });
                  }
                }}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2.5, 
                  fontWeight: 600, 
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  color: 'text.primary',
                  px: 2.5,
                  py: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: '#F8FAFC',
                    borderColor: 'divider'
                  }
                }}
              >
                Draft Technical Proposal
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={async () => {
                  if (!calcEntry) return;
                  try {
                    const totalSavings = clientOverview?.totalSavings || 0;
                    const numMonths = Math.max(1, clientOverview?.months?.length || 1);
                    const avgMonthlySavings = Math.round(totalSavings / numMonths);
                    const annualizedSavings = Math.round((totalSavings * 12) / numMonths);
                    
                    const billDateObj = calcEntry.billDate ? new Date(calcEntry.billDate) : new Date();
                    const billMonth = billDateObj.toLocaleString('default', { month: 'long' });
                    const billMonthYear = `${billMonth} ${billDateObj.getFullYear()}`;
                    
                    const currentDate = new Date();
                    const currentMonthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
                    
                    const monthsWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
                    const monthsCount = Math.min(12, clientOverview?.months?.length || 0);
                    const monthsCountWord = monthsCount > 0 && monthsCount < monthsWords.length ? monthsWords[monthsCount] : "Six";
                    
                    const monthlyData: any[] = [];
                    if (clientOverview && clientOverview.months) {
                        clientOverview.months.forEach((m) => {
                            const cleared = m.totalMarketEnergyKwh || 0;
                            const consumption = m.totalEnergyKwh || 0;
                            const oaCost = m.totalOptimizedCost || 0;
                            const discomCost = m.totalBaselineCost || 0;
                            const saving = m.savings || 0;
                            
                            const pct = consumption > 0 ? Math.round((cleared / consumption) * 100) : 0;
                            const ppcDiscom = consumption > 0 ? (discomCost / consumption) : 0;
                            const ppcProlt = consumption > 0 ? (oaCost / consumption) : 0;
                            const savingUnit = consumption > 0 ? (saving / consumption) : 0;

                            monthlyData.push({
                                month_name: m.month || '',
                                cleared: Math.round(cleared).toLocaleString('en-IN'),
                                consumption: Math.round(consumption).toLocaleString('en-IN'),
                                oa_cost: Math.round(oaCost).toLocaleString('en-IN'),
                                discom_cost: Math.round(discomCost).toLocaleString('en-IN'),
                                cleared_pct: `${pct}%`,
                                ppc_discom: `₹${ppcDiscom.toFixed(2)}`,
                                ppc_prolt: `₹${ppcProlt.toFixed(2)}`,
                                saving: `₹${Math.round(saving).toLocaleString('en-IN')}`,
                                saving_unit: `₹${savingUnit.toFixed(2)}`
                            });
                        });
                    }

                    const totalConsumption = clientOverview?.months?.reduce((acc: number, curr: any) => acc + (curr.totalEnergyKwh || 0), 0) || 1;
                    const totalCleared = clientOverview?.months?.reduce((acc: number, curr: any) => acc + (curr.clearedUnitsKwh || curr.oaConsumer || 0), 0) || 0;
                    const procurementPotential = Math.round((totalCleared / totalConsumption) * 100);

                    let dashboard_screenshot = "";
                    const dashboardEl = document.getElementById("proposal-export-target");
                    if (dashboardEl) {
                        try {
                            const canvas = await html2canvas(dashboardEl, { scale: 2 });
                            dashboard_screenshot = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                        } catch (e) {
                            console.error("html2canvas error:", e);
                        }
                    }

                    const payload = {
                      ...hardcodedPayload,
                      ...calcEntry,
                      monthlyData,
                      months_count_word: monthsCountWord,
                      procurement_potential: procurementPotential,
                      dashboard_screenshot: dashboard_screenshot,
                      // @ts-ignore
                      savings_in_words: numberToIndianWords ? numberToIndianWords(annualizedSavings) : 'Twenty Five',
                      totalSavings: annualizedSavings.toLocaleString('en-IN'), // Maps to "AVERAGE ANNUAL SAVINGS" in the docx
                      monthlySavings: avgMonthlySavings.toLocaleString('en-IN'), // Maps to "AVERAGE MONTHLY SAVINGS" in the docx
                      paybackDays: 150,
                      billMonth,
                      billMonthYear,
                      currentMonthYear,
                      probusPlatformFee: calcEntry.probusPlatformFee || 150000
                    };
                    await exportCommercialProposalWord(payload);
                  } catch (err: any) {
                    setSnackbar({
                      open: true,
                      message: err.message || 'Export failed',
                      severity: 'error'
                    });
                  }
                }}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2.5, 
                  fontWeight: 600, 
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  color: 'text.primary',
                  px: 2.5,
                  py: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: '#F8FAFC',
                    borderColor: 'divider'
                  }
                }}
              >
                Commercial Proposal
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => {
                  const originalTitle = document.title;
                  if (calcEntry?.clientName) {
                    document.title = `${calcEntry.clientName}_Energy_Savings_Report`;
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
                  backgroundColor: '#FFFFFF',
                  color: 'text.primary',
                  px: 2.5,
                  py: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: '#F8FAFC',
                    borderColor: 'divider'
                  }
                }}
              >
                Export PDF Report
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={async () => {
                  if (!calcEntry) return;
                  try {
                    await exportSavingsExcel(calcEntry.id, selectedSimMonth || undefined, selectedCalcVersion || undefined, calcEntry.clientName);
                  } catch (err: any) {
                    setSnackbar({
                      open: true,
                      message: err.message || 'Export failed',
                      severity: 'error'
                    });
                  }
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
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: '#1E293B',
                    borderColor: 'divider'
                  }
                }}
              >
                Export Excel Sheet
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={async () => {
                  if (!calcEntry) return;
                  try {
                    await exportDemandShiftExcel(calcEntry.id, selectedSimMonth || undefined, selectedCalcVersion || undefined);
                  } catch (err: any) {
                    setSnackbar({
                      open: true,
                      message: err.message || 'Export failed',
                      severity: 'error'
                    });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: 'divider',
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  px: 2.5,
                  py: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    borderColor: 'divider'
                  }
                }}
              >
                Export TOD Shifting Excel
              </Button>
            </Box>
          )}

          {calculating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} />
              <Typography variant="body2" color="text.secondary">
                Running cost simulations and sorting 15-minute slot metrics...
              </Typography>
            </Box>
          )}
          
          {calculatingInsights && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: '#14B8A6' }} />
              <Typography variant="body2" color="text.secondary">
                Calculating potential demand shift savings...
              </Typography>
            </Box>
          )}

          {!calculating && !calculatingInsights && !calcResult && !marketDecisionResult && !demandShiftInsights && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Click 'View' to load the landed cost analysis for your configured months.
              </Typography>
            </Box>
          )}

          {calcResult && !calculating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>

              <Box id="dashboard-screenshot-target" sx={{ mt: 3, bgcolor: '#F8FAFC', p: 2, borderRadius: 2 }}>
                <Dashboard calcResult={calcResult} calcEntry={calcEntry} clientName={calcEntry?.clientName || clientOverview?.clientName} clientOverview={clientOverview} marketDecisionResult={marketDecisionResult} demandShiftInsights={demandShiftInsights} selectedMonth={selectedSimMonth} />
              </Box>

              <div id="proposal-export-target" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1200px' }}>
                <ProposalDashboardExport 
                  clientOverview={clientOverview} 
                  marketDecisionResult={marketDecisionResult} 
                  demandShiftInsights={demandShiftInsights} 
                  selectedMonth={selectedSimMonth} 
                />
              </div>

              <div id="proposal-export-target-1" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1200px' }}>
                <ProposalDashboardExport 
                  clientOverview={clientOverview} 
                  marketDecisionResult={marketDecisionResult} 
                  demandShiftInsights={demandShiftInsights} 
                  selectedMonth={firstInsightMonthState} 
                />
              </div>

              <div id="proposal-export-target-2" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1200px' }}>
                <ProposalDashboardExport 
                  clientOverview={clientOverview} 
                  marketDecisionResult={marketDecisionResult} 
                  demandShiftInsights={demandShiftInsights} 
                  selectedMonth={secondInsightMonthState} 
                />
              </div>
            </Box>
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
<Dialog
        open={demandShiftGraphOpen}
        onClose={() => setDemandShiftGraphOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          Usage Recommendations Heatmap
          <IconButton onClick={() => setDemandShiftGraphOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {demandShiftInsights && (
            <SlotWiseMarketHeatmap slotsData={demandShiftInsights.slotsData} />
          )}
        </DialogContent>
      </Dialog>

<Dialog
        open={dynamicDemandShiftGraphOpen}
        onClose={() => setDynamicDemandShiftGraphOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          Dynamic Usage Recommendations Heatmap
          <IconButton onClick={() => setDynamicDemandShiftGraphOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {demandShiftInsights && (
            <DynamicSlotWiseMarketHeatmap slotsData={demandShiftInsights.slotsData} />
          )}
        </DialogContent>
      </Dialog>
      </Box>

      {/* Hidden PDF Report component (rendered only for printing via Portal to bypass layout hiding) */}
      {isPrintingRedesigned && calcEntry && Object.keys(cachedResults).length > 0 && createPortal(
        <Box className="print-container">
          <RedesignedSavingsReport 
            calcEntry={calcEntry} 
            allResults={Object.keys(cachedResults)
              .sort((a, b) => {
                if (a === 'all') return -1;
                if (b === 'all') return 1;
                return a.localeCompare(b);
              })
              .map(key => ({ month: key, marketDecisionResult: cachedResults[key].market }))
              .filter(res => res.marketDecisionResult !== null)
            }
          />
        </Box>,
        document.body
      )}
    </Box>
  );
}
