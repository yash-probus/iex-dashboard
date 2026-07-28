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
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (id) loadEntry();
  }, [id]);

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

          {marketDecisionResult && (
            <SlotWiseMarketHeatmap slotsData={marketDecisionResult.slotsData} />
          )}
        

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
