import React, { useState, useEffect } from 'react';
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
import { SavingsDashboard } from '../components/dashboard/SavingsDashboard';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import EmptyTableState from '../components/dashboard/EmptyTableState';
import { ClientOverviewDashboard } from '../components/dashboard/ClientOverviewDashboard';
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
  ClientOverviewResult
} from '../api/savingsCalculator.api';
import { VisualAnalyticsCharts } from '../components/insights/VisualAnalyticsCharts';
import EnergyInsightsExplorer from '../components/insights/EnergyInsightsExplorer';
import { exportToCSV } from '../utils/export';
import { getResourceData } from '../api/resourceCenter.api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const calcResult = cachedResults[selectedSimMonth]?.calc || null;
  const marketDecisionResult = cachedResults[selectedSimMonth]?.market || null;
  const demandShiftInsights = cachedResults[selectedSimMonth]?.insights || null;

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
          
          const months = Object.keys(entry.todConsumptions || {}).sort();
          if (months.length > 0) {
            setSelectedSimMonth(months[0]);
          } else {
            setSelectedSimMonth('all');
          }
          
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
      
      await Promise.all(months.map(async (m) => {
        const res = await fetchDemandShiftInsights(calcEntry.id, m, selectedCalcVersion || undefined);
        if (!newCache[m]) newCache[m] = { calc: null, market: null, insights: null };
        newCache[m].insights = res;
      }));
      
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


  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton 
          onClick={() => navigate('/savings-calculator')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Savings Analysis for {calcEntry?.clientName}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>

            {Object.keys(cachedResults).length > 0 && (
              <Box sx={{ width: '100%', mb: 2, borderBottom: 1, borderColor: 'divider' }}>
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

            {calcResult && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportCalcToCSV}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2, 
                  borderColor: 'divider', 
                  color: 'text.secondary' 
                }}
              >
                Export CSV
              </Button>
            )}
            
            {marketDecisionResult && (
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={async () => {
                  if (!calcEntry) return;
                  try {
                    await exportSavingsExcel(calcEntry.id, selectedSimMonth || undefined, selectedCalcVersion || undefined);
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
                  borderRadius: 2, 
                  fontWeight: 600, 
                  borderColor: 'divider',
                  backgroundColor: '#0F172A',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1E293B',
                    borderColor: 'divider'
                  }
                }}
              >
                Export Excel Sheet
              </Button>
            )}
          </Box>

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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2.5, height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Total Sourced Energy
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: marketDecisionResult?.todSummaries ? 1.5 : 0 }}>
                        {(marketDecisionResult ? marketDecisionResult.totalEnergyKwh : calcResult.totalEnergyKwh).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
                      </Typography>
                      {marketDecisionResult?.todSummaries && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {marketDecisionResult.todSummaries.map((summary, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{summary.slabName}</Typography>
                              <Typography variant="caption" fontWeight={700}>{summary.totalEnergyKwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2.5, height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Market Sourced Energy
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#16A34A', mb: marketDecisionResult?.todSummaries ? 1.5 : 0 }}>
                        {(marketDecisionResult
                          ? marketDecisionResult.totalMarketEnergyKwh
                          : (calcResult.totalMarketEnergyKwh || 0)
                        ).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
                      </Typography>
                      {marketDecisionResult?.todSummaries && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {marketDecisionResult.todSummaries.map((summary, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{summary.slabName}</Typography>
                              <Typography variant="caption" fontWeight={700} color="#16A34A">
                                {summary.marketEnergyKwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
                                {summary.marketCostBase !== undefined && ` • ₹${summary.marketCostBase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tabs value={calcTab} onChange={(e, v) => setCalcTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
                  {selectedSimMonth !== 'all' && <Tab label="Slabs Group Summary (TOD Sorted)" disabled={!calcResult} value={0} />}
                  {selectedSimMonth !== 'all' && <Tab label="Cheapest Month-wide Slots" disabled={!calcResult} value={1} />}
                  <Tab label={selectedSimMonth === 'all' ? "Summary" : "Market Buy Decision"} disabled={!marketDecisionResult} value={2} />
                  {selectedSimMonth !== 'all' && <Tab label="Detailed OA Simulation" disabled={!marketDecisionResult?.oaDetailed} value={3} />}
                  <Tab label="Usage Recommendations" disabled={!demandShiftInsights} value={4} />
                  <Tab label="Visual Analytics" disabled={!marketDecisionResult || !demandShiftInsights} value={5} />
                </Tabs>
              </Box>

              {selectedSimMonth === 'all' && (calcTab === 0 || calcTab === 1 || calcTab === 3) && (
                <Box sx={{ mt: 3 }}>
                  <ClientOverviewDashboard clientOverview={clientOverview} overviewLoading={overviewLoading} />
                </Box>
              )}

              {calcTab === 0 && calcResult && selectedSimMonth !== 'all' && (
                <Grid container spacing={3}>
                  {Object.entries(calcResult.todGroups).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, list]) => {
                    const groupCount = Object.keys(calcResult.todGroups).length;
                    const lgValue = groupCount === 4 ? 3 : groupCount === 3 ? 4 : groupCount === 2 ? 6 : 12;
                    return (
                    <Grid item xs={12} lg={lgValue} key={groupName}>
                      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2, height: '100%', bgcolor: 'background.paper' }}>
                        <Typography variant="h4" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{groupName}</span>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {list.length} slots
                          </Typography>
                        </Typography>
                        
                        <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#F8FAFC' }}>Date/Time</TableCell>
                                <TableCell align="right" sx={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#F8FAFC' }}>Lowest Price</TableCell>
                                <TableCell align="right" sx={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#F8FAFC' }}>DISCOM</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {list.slice(0, 50).map((row, idx) => (
                                <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                                  <TableCell sx={{ fontSize: '11px', py: 0.75 }}>
                                    {row.date.substring(5)} {row.timeStr}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 600, color: '#16A34A', py: 0.75 }}>
                                    ₹{row.comparedLowestPrice.toFixed(2)}
                                    <span style={{ 
                                      fontSize: '9px', 
                                      fontWeight: 800, 
                                      color: row.selectedSource === 'DISCOM' ? '#64748B' : '#7C3AED',
                                      backgroundColor: row.selectedSource === 'DISCOM' ? '#F1F5F9' : '#F5F3FF',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      marginLeft: '4px'
                                    }}>
                                      {row.selectedSource}
                                    </span>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: '11px', color: 'text.secondary', py: 0.75 }}>
                                    ₹{row.discomLandingPrice.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Box>
                    </Grid>
                  );
                  })}
                </Grid>
              )}

              {calcTab === 1 && calcResult && selectedSimMonth !== 'all' && (
                <Box sx={{ maxHeight: 400, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Time</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DAM</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>GDAM</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>RTM</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DISCOM Rate</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Compared Lowest</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Cheapest Source</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Decision</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calcResult.sortedMonthlyList.slice(0, 100).map((row, idx) => (
                        <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell align="center">{row.timeStr}</TableCell>
                          <TableCell align="center">
                            <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'text.secondary' }}>
                              {row.todSlab}
                            </span>
                          </TableCell>
                          <TableCell align="right">₹{row.damLandingPrice > 0 ? row.damLandingPrice.toFixed(4) : '-'}</TableCell>
                          <TableCell align="right">₹{row.gdamLandingPrice > 0 ? row.gdamLandingPrice.toFixed(4) : '-'}</TableCell>
                          <TableCell align="right">₹{row.rtmLandingPrice > 0 ? row.rtmLandingPrice.toFixed(4) : '-'}</TableCell>
                          <TableCell align="right">₹{row.discomLandingPrice.toFixed(4)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#16A34A' }}>₹{row.comparedLowestPrice.toFixed(4)}</TableCell>
                          <TableCell align="center">
                            <span style={{ 
                              textTransform: 'uppercase', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: row.selectedSource === 'DISCOM' ? '#64748B' : '#7C3AED',
                              backgroundColor: row.selectedSource === 'DISCOM' ? '#F1F5F9' : '#F5F3FF',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {row.selectedSource}
                            </span>
                          </TableCell>
                          <TableCell align="center">
                            <span style={{ 
                              textTransform: 'uppercase', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: row.selectedSource !== 'DISCOM' ? '#16A34A' : '#DC2626',
                              backgroundColor: row.selectedSource !== 'DISCOM' ? '#DCFCE7' : '#FEE2E2',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {row.selectedSource !== 'DISCOM' ? 'Yes' : 'No'}
                            </span>
                          </TableCell>
                          <TableCell align="right">₹{row.optimizedCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              
              {calcTab === 2 && marketDecisionResult && (
                <Box>
                  <SavingsDashboard result={marketDecisionResult} monthStr={selectedSimMonth} />
                  
                  {selectedSimMonth !== 'all' ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Slot-wise Market Simulation
                        </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<BarChartIcon />}
                      onClick={() => setGraphDialogOpen(true)}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      View Daily Simulation Graph
                    </Button>
                  </Box>
                  
                  <Box sx={{ maxHeight: 500, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                    <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Time</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Source</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Landing (₹)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DISCOM Landing (₹)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Buy from Market?</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Savings/kWh (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marketDecisionResult.slotsData.slice(0, 150).map((row: any, idx: number) => {
                        const isOaEligible = (marketDecisionResult.totalSavings - (marketDecisionResult.oaDetailed?.dailyFixedOverhead || 0) - (marketDecisionResult.oaDetailed?.bidApplicationFees || 0)) > 0;
                        const buyDecision = isOaEligible && row.shouldBuyFromMarket;
                        
                        return (
                        <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell align="center">{row.timeStr || `${String(row.hour).padStart(2, '0')}:${String((row.timeblock - 1) * 15 % 60).padStart(2, '0')}`}</TableCell>
                          <TableCell align="center">
                            <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'text.secondary' }}>
                              {row.tod}
                            </span>
                          </TableCell>
                          <TableCell align="right">
                            <span style={{ 
                              textTransform: 'uppercase', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: row.marketSource === 'DAM' ? '#3B82F6' : row.marketSource === 'GDAM' ? '#10B981' : '#8B5CF6',
                              backgroundColor: row.marketSource === 'DAM' ? '#EFF6FF' : row.marketSource === 'GDAM' ? '#ECFDF5' : '#F5F3FF',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {row.marketSource}
                            </span>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.bestMarketLanding > 0 ? row.bestMarketLanding.toFixed(4) : '-'}</TableCell>
                          <TableCell align="right">₹{row.discomLanding.toFixed(4)}</TableCell>
                          <TableCell align="center">
                            <span style={{ 
                              textTransform: 'uppercase', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: buyDecision ? '#16A34A' : '#DC2626',
                              backgroundColor: buyDecision ? '#DCFCE7' : '#FEE2E2',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {buyDecision ? 'Yes' : 'No'}
                            </span>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: row.savingsPerKwh > 0 ? '#16A34A' : 'inherit' }}>
                            {row.savingsPerKwh > 0 ? `₹${row.savingsPerKwh.toFixed(4)}` : '-'}
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                    </Table>
                  </Box>
                  </>
                  ) : (
                    <Box sx={{ mt: 3 }}>
                      <ClientOverviewDashboard clientOverview={clientOverview} overviewLoading={overviewLoading} />
                    </Box>
                  )}
                </Box>
              )}


              {calcTab === 3 && marketDecisionResult?.oaDetailed?.breakdown && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Detailed OA Savings Breakdown
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />} 
                      onClick={exportDetailedOAToCSV}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Export Detailed Report CSV
                    </Button>
                  </Box>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Total Sourced (DISCOM Units)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Market Sourced (OA Units)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DISCOM Bill (Total)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Prolt DISCOM Bill (Net)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>OA Consumer Bus Units</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>OA Bill</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marketDecisionResult.oaDetailed.breakdown.map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{row.slabName}</TableCell>
                            <TableCell align="right">{row.discomUnits.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</TableCell>
                            <TableCell align="right">{row.oaUnits.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</TableCell>
                            <TableCell align="right">₹{row.discomBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell align="right">₹{row.proltDiscomBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell align="right">{row.consumerBusUnits.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh</TableCell>
                            <TableCell align="right">₹{row.oaBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.discomUnits, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.oaUnits, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.discomBill, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.proltDiscomBill, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.consumerBusUnits, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.oaBill, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 4, mt: 2, p: 2, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">SLDC Scheduling Cost</Typography>
                      <Typography variant="body2" fontWeight={600}>₹{(marketDecisionResult.oaDetailed.sldcSchedulingCost || 0).toLocaleString('en-IN')} ({marketDecisionResult.oaDetailed.totalDaysTraded} days)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">NLDC Scheduling Cost</Typography>
                      <Typography variant="body2" fontWeight={600}>₹{(marketDecisionResult.oaDetailed.nldcSchedulingCost || 0).toLocaleString('en-IN')} ({marketDecisionResult.oaDetailed.totalDaysTraded} days)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Total Estimated OA Bill (Inc. Overheads)</Typography>
                      <Typography variant="body2" fontWeight={700} color="#7C3AED">
                        ₹{(
                          marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.oaBill, 0) + 
                          marketDecisionResult.oaDetailed.dailyFixedOverhead + 
                          marketDecisionResult.oaDetailed.bidApplicationFees
                        ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Total Gross Bill (Net Landed OA Cost)</Typography>
                      <Typography variant="body2" fontWeight={700} color="#E11D48">
                        ₹{(
                          marketDecisionResult.totalLandedExchangeCost + 
                          marketDecisionResult.oaDetailed.dailyFixedOverhead + 
                          marketDecisionResult.oaDetailed.bidApplicationFees
                        ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Net Savings</Typography>
                      {(() => {
                        const rawSavings = marketDecisionResult.totalSavings - marketDecisionResult.oaDetailed.dailyFixedOverhead - marketDecisionResult.oaDetailed.bidApplicationFees;
                        if (rawSavings <= 0) {
                          return (
                            <Typography variant="body2" fontWeight={700} color="#DC2626">
                              Not Eligible for OA
                            </Typography>
                          );
                        }
                        return (
                          <Typography variant="body2" fontWeight={700} color="#16A34A">
                            ₹{rawSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </Typography>
                        );
                      })()}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {calcTab === 4 && demandShiftInsights && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Usage Recommendations: Demand Shifting</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<BarChartIcon />}
                    onClick={() => setDemandShiftGraphOpen(true)}
                    sx={{ 
                      textTransform: 'none', 
                      borderRadius: 2, 
                      bgcolor: '#F59E0B',
                      '&:hover': {
                        bgcolor: '#D97706'
                      }
                    }}
                  >
                    Slot-wise Heatmap
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<BarChartIcon />}
                    onClick={() => setDynamicDemandShiftGraphOpen(true)}
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
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportInsightsToCSV}
                    sx={{ 
                      textTransform: 'none', 
                      borderRadius: 2, 
                      borderColor: 'divider', 
                      color: 'text.secondary' 
                    }}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportInsightsToExcel}
                    sx={{ 
                      textTransform: 'none', 
                      borderRadius: 2, 
                      borderColor: 'divider', 
                      color: '#10B981',
                      '&:hover': {
                        borderColor: '#059669',
                        bgcolor: '#F0FDF4'
                      }
                    }}
                  >
                    Export Excel
                  </Button>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Original Energy Cost</Typography>
                    <Typography variant="h4" fontWeight={700}>₹{demandShiftInsights.originalTotalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Shifted Energy Cost</Typography>
                    <Typography variant="h4" fontWeight={700}>₹{demandShiftInsights.newTotalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ bgcolor: '#F0FDF4', p: 3, borderRadius: 3, border: '1px solid', borderColor: '#BBF7D0', height: '100%' }}>
                    <Typography variant="subtitle2" color="#166534" sx={{ mb: 1 }}>Potential Extra Savings</Typography>
                    <Typography variant="h4" fontWeight={700} color="#15803D">₹{demandShiftInsights.savingsAchieved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                    <Typography variant="body2" color="#166534" sx={{ mt: 1 }}>by shifting {demandShiftInsights.shiftedEnergy.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh to cheaper slots</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ bgcolor: '#EFF6FF', p: 3, borderRadius: 3, border: '1px solid', borderColor: '#BFDBFE', height: '100%' }}>
                    <Typography variant="subtitle2" color="#1E40AF" sx={{ mb: 1 }}>Total Potential Savings</Typography>
                    {(() => {
                      const baseRawSavings = marketDecisionResult ? marketDecisionResult.totalSavings : 0;
                      const baseSavings = Math.max(0, baseRawSavings);
                      const totalCombinedSavings = baseSavings + demandShiftInsights.savingsAchieved;
                      return (
                        <>
                          <Typography variant="h4" fontWeight={700} color="#1D4ED8">₹{totalCombinedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                          <Typography variant="body2" color="#1E40AF" sx={{ mt: 1 }}>(Base OA Savings + Demand Shifting)</Typography>
                        </>
                      );
                    })()}
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 2 }}>TOD Shifting Summary</Typography>
              <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600 }}>TOD Slab</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Original Energy (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Orig Market (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>New Energy (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>New Market (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Difference (kWh)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {demandShiftInsights.todShiftSummary.map((row) => (
                      <TableRow key={row.tod}>
                        <TableCell>{row.tod}</TableCell>
                        <TableCell align="right">{row.originalEnergy.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{row.originalMarketEnergy?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</TableCell>
                        <TableCell align="right">{row.newEnergy.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>{row.newMarketEnergy?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</TableCell>
                        <TableCell align="right" sx={{ color: row.diff > 0 ? '#16A34A' : row.diff < 0 ? '#DC2626' : 'inherit', fontWeight: row.diff !== 0 ? 600 : 400 }}>
                          {row.diff > 0 ? '+' : ''}{row.diff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {demandShiftInsights.todShiftSummary.reduce((sum, row) => sum + (row.originalEnergy || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {demandShiftInsights.todShiftSummary.reduce((sum, row) => sum + (row.originalMarketEnergy || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {demandShiftInsights.todShiftSummary.reduce((sum, row) => sum + (row.newEnergy || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {demandShiftInsights.todShiftSummary.reduce((sum, row) => sum + (row.newMarketEnergy || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {(() => {
                          const totalDiff = demandShiftInsights.todShiftSummary.reduce((sum, row) => sum + (row.diff || 0), 0);
                          return (
                            <Box component="span" sx={{ color: totalDiff > 0 ? '#16A34A' : totalDiff < 0 ? '#DC2626' : 'inherit' }}>
                              {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Box>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}

          {calcTab === 5 && marketDecisionResult && demandShiftInsights && (
            <VisualAnalyticsCharts 
              marketDecisionResult={marketDecisionResult} 
              demandShiftInsights={demandShiftInsights}
              maxEnergyPerSlot={demandShiftInsights.maxEnergyPerSlot} 
            />
          )}
        

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => navigate('/savings-calculator')} 
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            Close
          </Button>
        </DialogActions>
      

      {/* History Dialog */}
      

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


      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
