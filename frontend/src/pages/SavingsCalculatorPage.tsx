import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, alpha, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton, Alert, Snackbar,
  Grid, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress
} from '@mui/material';
import { 
  Calculate as CalculateIcon, 
  Add as AddIcon,
  Visibility as VisibilityIcon,
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
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import EmptyTableState from '../components/dashboard/EmptyTableState';
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
  exportSavingsExcel
} from '../api/savingsCalculator.api';
import { exportToCSV } from '../utils/export';
import { getResourceData } from '../api/resourceCenter.api';
import { STATE_TARIFF_MOCK_DATA } from './resource-center/mockData/stateTariff.mock';
import { DISCOM_LIST_MOCK_DATA } from './resource-center/mockData/discomList.mock';

type DialogMode = 'create' | 'edit' | 'view' | null;

export default function SavingsCalculatorPage() {
  // State variables
  const [entries, setEntries] = useState<SavingsCalculatorEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedEntry, setSelectedEntry] = useState<SavingsCalculatorEntry | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Form Fields State
  const [clientName, setClientName] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [address, setAddress] = useState('');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [discom, setDiscom] = useState('');
  const [consumerCategory, setConsumerCategory] = useState('');
  const [voltageLevel, setVoltageLevel] = useState('');
  const [supplyVoltageValue, setSupplyVoltageValue] = useState('');
  const [proltMargin, setProltMargin] = useState<string>('');
  const [traderMargin, setTraderMargin] = useState('');
  
  const [todConsumptions, setTodConsumptions] = useState<Record<string, Record<string, string>>>({});
  
  // Validation Errors
  const [formErrors, setFormErrors] = useState<{ 
    clientName?: string; 
    industryName?: string; 
    address?: string;
    sanctionedLoadKw?: string;
    clientDetails?: string;
  }>({});

  // Submitting States
  const [submitting, setSubmitting] = useState(false);
  
  // PROLT Dialog State
  const [proltDialogOpen, setProltDialogOpen] = useState(false);

  // Calculation Dialog States
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);
  const [calcEntry, setCalcEntry] = useState<SavingsCalculatorEntry | null>(null);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [marketDecisionResult, setMarketDecisionResult] = useState<MarketDecisionResult | null>(null);
  const [calculatingMarket, setCalculatingMarket] = useState(false);
  const [calcTab, setCalcTab] = useState(0);

  // Market Decision States
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

  // Snackbar Notification State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch entries
  const [tariffData, setTariffData] = useState<any[]>([]);
  const [discomList, setDiscomList] = useState<any[]>([]);
  const [regionStates, setRegionStates] = useState<any[]>([]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSavingsEntries();
      setEntries(data);
    } catch (err: any) {
      console.error('Failed to load entries:', err);
      setError(err.message || 'Failed to connect to the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadResourceData = async () => {
    try {
      const [tariffRes, discomRes, regionRes] = await Promise.all([
        getResourceData('state-tariff'),
        getResourceData('discom-list'),
        getResourceData('region-state')
      ]);
      if (tariffRes.success && tariffRes.data.length > 0) {
        setTariffData(tariffRes.data);
      } else {
        setTariffData(STATE_TARIFF_MOCK_DATA);
      }
      if (discomRes.success && discomRes.data.length > 0) {
        setDiscomList(discomRes.data);
      } else {
        setDiscomList(DISCOM_LIST_MOCK_DATA);
      }
      if (regionRes.success && regionRes.data.length > 0) {
        setRegionStates(regionRes.data);
      }
    } catch (err) {
      console.error('Failed to load resource data, falling back to mock data:', err);
      setTariffData(STATE_TARIFF_MOCK_DATA);
      setDiscomList(DISCOM_LIST_MOCK_DATA);
    }
  };

  useEffect(() => {
    loadEntries();
    loadResourceData();
  }, []);

  const [entryYear, setEntryYear] = useState<number>(new Date().getFullYear());
  const [entryMonth, setEntryMonth] = useState<number>(new Date().getMonth() + 1);

  const [selectedSimMonth, setSelectedSimMonth] = useState<string>('');

  const uniqueStates = React.useMemo(() => {
    const statesSet = new Set<string>();
    tariffData.forEach((row: any) => {
      if (row.state) statesSet.add(row.state);
    });
    return Array.from(statesSet)
      .sort()
      .map((name) => ({ stateCode: name, stateName: name }));
  }, [tariffData]);

  const filteredDiscoms = React.useMemo(() => {
    // We need to match the selected stateCode (which could be "Uttar Pradesh" or "UP")
    // against the discom's stateCode (which is "UP").
    let normalizedCode = stateCode;
    const region = regionStates.find(r => r.stateName.toLowerCase() === stateCode?.toLowerCase() || r.stateCode.toLowerCase() === stateCode?.toLowerCase());
    if (region) {
      normalizedCode = region.stateCode;
    }

    return discomList
      .filter((d: any) => !stateCode || d.stateCode === normalizedCode || d.state === stateCode || d.stateCode === stateCode)
      .map((d: any) => ({ code: d.code, legalName: d.legalName }));
  }, [discomList, stateCode, regionStates]);

  const uniqueCategories = React.useMemo(() => {
    const categoriesSet = new Set<string>();
    tariffData.forEach((row: any) => {
      const matchState = !stateCode || 
        row.state?.toLowerCase() === stateCode.trim().toLowerCase() ||
        (stateCode === 'UP' && row.state?.toLowerCase() === 'uttar pradesh');
      if (matchState && row.consumerCategory) categoriesSet.add(row.consumerCategory);
    });

    // Always ensure the known UP categories are present
    categoriesSet.add('LMV-11');
    categoriesSet.add('HV-1');
    categoriesSet.add('HV-2');

    return Array.from(categoriesSet).sort();
  }, [tariffData, stateCode]);

  const uniqueVoltageLevels = React.useMemo(() => {
    if (consumerCategory.startsWith('LMV-11')) return ['Low Tension (LT)', 'High Tension (HT)'];
    if (consumerCategory.startsWith('HV-1')) return ['At 11 kV', 'Above 11 kV'];
    if (consumerCategory.startsWith('HV-2')) return ['Up to 11 kV', 'Above 11 kV to 66 kV', 'Above 66 kV to 132 kV', 'Above 132 kV'];

    const levelsSet = new Set<string>();
    tariffData.forEach((row: any) => {
      const matchState = !stateCode || 
        row.state?.toLowerCase() === stateCode.trim().toLowerCase() ||
        (stateCode === 'UP' && row.state?.toLowerCase() === 'uttar pradesh');
      const matchCategory = !consumerCategory || row.consumerCategory === consumerCategory;
      if (matchState && matchCategory && row.supplyVoltageCategory) {
        levelsSet.add(row.supplyVoltageCategory);
      }
    });
    return Array.from(levelsSet);
  }, [tariffData, stateCode, consumerCategory]);

  const getTodSlabsForMonth = React.useCallback((targetMonth: number) => {
    const slabsSet = new Set<string>();
    tariffData.forEach((row: any) => {
      const matchState = !stateCode || 
        row.state?.toLowerCase() === stateCode.trim().toLowerCase() ||
        (stateCode === 'UP' && row.state?.toLowerCase() === 'uttar pradesh');
      const matchCategory = !consumerCategory || row.consumerCategory === consumerCategory;
      let parsedVoltageLevel = voltageLevel;
      if (parsedVoltageLevel && parsedVoltageLevel.includes(' - ')) {
        parsedVoltageLevel = parsedVoltageLevel.split(' - ')[0];
      }
      const matchVoltage = !voltageLevel || row.supplyVoltageCategory === parsedVoltageLevel;
      // month in new schema is YYYYMM int; targetMonth from todConsumptions is 1-12
      // Match by the last two digits of the stored month
      const storedMonthNum = row.month % 100;
      const matchMonth = storedMonthNum === targetMonth;

      if (matchState && matchCategory && matchVoltage && matchMonth) {
        // Derive a slab name from tod times: use start-end or 'FLAT' when no TOD
        const start = row.todStartTime || '—';
        const end = row.todEndTime || '—';
        const slabName = (start === '—' && end === '—')
          ? 'FLAT'
          : `${start}-${end}`;
        slabsSet.add(slabName.toUpperCase());
      }
    });
    // If no slabs found, always include a FLAT slab
    if (slabsSet.size === 0) slabsSet.add('FLAT');
    return Array.from(slabsSet).sort();
  }, [tariffData, stateCode, consumerCategory, voltageLevel]);

  const availableSupplyVoltageValues = React.useMemo(() => {
    switch (voltageLevel) {
      case 'At 11 kV': return ['11'];
      case 'Above 11 kV': return ['33', '66', '132'];
      case 'Up to 11 kV': return ['11'];
      case 'Above 11 kV to 66 kV': return ['33', '66'];
      case 'Above 66 kV to 132 kV': return ['132'];
      default: return [];
    }
  }, [voltageLevel]);

  const resetForm = () => {
    setClientName('');
    setIndustryName('');
    setAddress('');
    setSanctionedLoadKw('');
    setStateCode('');
    setDiscom('');
    setConsumerCategory('');
    setVoltageLevel('');
    setSupplyVoltageValue('');
    setProltMargin('');
    setTraderMargin('');
    setTodConsumptions({});
    setFormErrors({});
  };

  const handleOpenDialog = (mode: DialogMode, entry?: SavingsCalculatorEntry) => {
    setDialogMode(mode);
    setFormErrors({});
    if (entry) {
      setSelectedEntry(entry);
      setClientName(entry.clientName);
      setIndustryName(entry.industryName);
      setAddress(entry.address);
      setSanctionedLoadKw(entry.sanctionedLoadKw ? String(entry.sanctionedLoadKw) : '');
      setStateCode(entry.stateCode || '');
      setDiscom(entry.discom || '');
      setConsumerCategory(entry.consumerCategory || '');
      
      let parsedVoltageLevel = entry.voltageLevel || '';
      let parsedSupplyVoltageValue = '';
      if (parsedVoltageLevel.includes(' - ')) {
        const parts = parsedVoltageLevel.split(' - ');
        parsedVoltageLevel = parts[0];
        parsedSupplyVoltageValue = parts.slice(1).join(' - ');
      }
      setVoltageLevel(parsedVoltageLevel);
      setSupplyVoltageValue(parsedSupplyVoltageValue);
      
      setProltMargin(entry.proltMargin ? String(entry.proltMargin) : '');
      setTraderMargin(entry.traderMargin ? String(entry.traderMargin) : '');
      
      const tc: Record<string, Record<string, string>> = {};
      if (entry.todConsumptions) {
        Object.keys(entry.todConsumptions).forEach(ym => {
          tc[ym] = {};
          Object.keys(entry.todConsumptions![ym] as Record<string, any>).forEach(slab => {
            tc[ym][slab] = String((entry.todConsumptions![ym] as Record<string, any>)[slab]);
          });
        });
      }
      setTodConsumptions(tc);
      
      setActiveStep(6); 
    } else {
      setSelectedEntry(null);
      resetForm();
      setActiveStep(0); 
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return clientName.trim() !== '' && industryName.trim() !== '' && address.trim() !== '';
      case 1:
        return stateCode.trim() !== '';
      case 2:
        return discom.trim() !== '';
      case 3:
        return consumerCategory.trim() !== '';
      case 4:
        if (!voltageLevel.trim()) return false;
        if (availableSupplyVoltageValues.length > 0 && !supplyVoltageValue.trim()) return false;
        return true;
      case 5:
        if (!sanctionedLoadKw.trim()) return false;
        const parsed = parseFloat(sanctionedLoadKw);
        return !isNaN(parsed) && parsed > 0;
      case 6:
        let isValid = true;
        Object.values(todConsumptions).forEach(monthData => {
          Object.values(monthData).forEach(val => {
            if (val.trim()) {
              const v = parseFloat(val);
              if (isNaN(v) || v < 0) isValid = false;
            }
          });
        });
        return isValid;
      default:
        return false;
    }
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
    setSelectedEntry(null);
    setFormErrors({});
    setProltDialogOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!clientName.trim()) errors.clientName = 'Client Name is required.';
    if (!industryName.trim()) errors.industryName = 'Industry Name is required.';
    if (!address.trim()) errors.address = 'Address is required.';
    
    if (sanctionedLoadKw.trim()) {
      const parsed = parseFloat(sanctionedLoadKw);
      if (isNaN(parsed) || parsed <= 0) {
        errors.sanctionedLoadKw = 'Sanctioned load must be a positive number.';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (dialogMode === 'view') return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        clientName: clientName.trim(),
        industryName: industryName.trim(),
        address: address.trim(),
        sanctionedLoadKw: sanctionedLoadKw.trim() ? parseFloat(sanctionedLoadKw) : undefined,
        stateCode: stateCode.trim() || undefined,
        discom: discom.trim() || undefined,
        consumerCategory: consumerCategory.trim() || undefined,
        voltageLevel: (voltageLevel.trim() ? (supplyVoltageValue.trim() ? `${voltageLevel.trim()} - ${supplyVoltageValue.trim()}` : voltageLevel.trim()) : undefined),
        proltMargin: proltMargin ? Number(proltMargin) : undefined,
        traderMargin: traderMargin ? Number(traderMargin) : undefined,
        todConsumptions: Object.keys(todConsumptions).length > 0 ? 
          Object.fromEntries(
            Object.entries(todConsumptions).map(([ym, data]) => [
              ym,
              Object.fromEntries(Object.entries(data).filter(([_, v]) => v.trim() !== '').map(([k, v]) => [k, parseFloat(v)]))
            ])
          )
          : undefined,
      };

      if (dialogMode === 'create') {
        await createSavingsEntry(payload);
        setSnackbar({
          open: true,
          message: 'Entry created successfully!',
          severity: 'success'
        });
      } else if (dialogMode === 'edit' && selectedEntry) {
        await updateSavingsEntry(selectedEntry.id, payload);
        setSnackbar({
          open: true,
          message: 'Entry updated successfully!',
          severity: 'success'
        });
      }

      handleCloseDialog();
      loadEntries();
    } catch (err: any) {
      console.error('Failed to submit form:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Operation failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteSavingsEntry(id);
      setSnackbar({
        open: true,
        message: 'Entry deleted successfully!',
        severity: 'success'
      });
      loadEntries();
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Delete operation failed.',
        severity: 'error'
      });
    }
  };

  const handleOpenCalc = (entry: SavingsCalculatorEntry) => {
    setCalcEntry(entry);
    setCalcResult(null);
    setMarketDecisionResult(null);
    setCalcDialogOpen(true);
    setCalcTab(0);
    
    const months = Object.keys(entry.todConsumptions || {}).sort();
    setSelectedSimMonth(months.length > 0 ? months[0] : '');
  };

  const handleCloseCalc = () => {
    setCalcDialogOpen(false);
    setCalcEntry(null);
    setCalcResult(null);
    setMarketDecisionResult(null);
  };

  const executeCalculation = async () => {
    if (!calcEntry) return;
    try {
      setCalculating(true);
      const res = await calculateSavings(calcEntry.id, selectedSimMonth || undefined);
      setCalcResult(res);
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

  const executeMarketDecision = async () => {
    if (!calcEntry) return;
    try {
      setCalculatingMarket(true);
      const res = await calculateMarketDecision(calcEntry.id, selectedSimMonth || undefined);
      setMarketDecisionResult(res);
      setCalcTab(2);
    } catch (err: any) {
      console.error('Market Decision failed:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Market decision calculation failed.',
        severity: 'error'
      });
    } finally {
      setCalculatingMarket(false);
    }
  };

  const executeOASimulation = async () => {
    if (!calcEntry) return;
    try {
      setCalculatingMarket(true);
      const res = await calculateMarketDecision(calcEntry.id, selectedSimMonth || undefined);
      setMarketDecisionResult(res);
      setCalcTab(3);
    } catch (err: any) {
      console.error('Market Decision failed:', err);
      setSnackbar({
        open: true,
        message: err.message || 'OA simulation calculation failed.',
        severity: 'error'
      });
    } finally {
      setCalculatingMarket(false);
    }
  };

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
    }));
    
    const filename = `${calcResult.clientName}_savings_report.csv`;
    exportToCSV(exportData, filename);
  };

  const renderStep = (
    stepIndex: number, 
    stepMeta: { icon: React.ReactNode; title: string; question: string; summary: string; content: React.ReactNode }
  ) => {
    const isCompleted = stepIndex < activeStep || dialogMode === 'view';
    const isActive = stepIndex === activeStep && dialogMode !== 'view';
    const isFuture = stepIndex > activeStep && dialogMode !== 'view';

    if (isFuture) return null;

    if (isCompleted) {
      return (
        <Card 
          key={stepIndex}
          elevation={0}
          sx={{ 
            border: '1px solid', 
            borderColor: 'divider', 
            bgcolor: '#F8FAFC',
            borderRadius: '12px',
            p: 1.75,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: dialogMode !== 'view' ? '#8B5CF6' : 'divider',
              bgcolor: dialogMode !== 'view' ? `${alpha('#8B5CF6', 0.02)}` : '#F8FAFC'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {stepMeta.summary}
              </Typography>
            </Box>
            {dialogMode !== 'view' && (
              <IconButton size="small" onClick={() => setActiveStep(stepIndex)} title="Edit step">
                <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </IconButton>
            )}
          </Box>
        </Card>
      );
    }

    if (isActive) {
      return (
        <Card 
          key={stepIndex}
          elevation={0}
          sx={{ 
            border: '2px solid #8B5CF6', 
            borderRadius: '16px',
            p: 3,
            boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.08), 0 2px 6px -1px rgba(139, 92, 246, 0.04)',
            bgcolor: '#FFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ color: '#8B5CF6', display: 'flex', alignItems: 'center' }}>
              {stepMeta.icon}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
              {stepMeta.question}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            {stepMeta.content}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {stepIndex > 0 && (
              <Button 
                onClick={() => setActiveStep(stepIndex - 1)}
                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
              >
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => {
                if (isStepValid(stepIndex)) {
                  if (stepIndex < 6) {
                    setActiveStep(stepIndex + 1);
                  } else {
                    setProltDialogOpen(true);
                  }
                } else {
                  if (stepIndex === 0) {
                    setFormErrors({ clientDetails: 'Please fill in all required client details.' });
                  } else if (stepIndex === 5) {
                    setFormErrors({ sanctionedLoadKw: 'Sanctioned load must be a positive number.' });
                  } else if (stepIndex === 6) {
                    setSnackbar({ open: true, message: 'Please enter valid numbers for TOD consumption', severity: 'error' });
                  }
                }
              }}
              endIcon={stepIndex === 6 ? undefined : <ArrowForwardIcon />}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2.5, 
                fontWeight: 600, 
                bgcolor: '#8B5CF6',
                '&:hover': {
                  bgcolor: '#7C3AED'
                }
              }}
            >
              {stepIndex === 6 ? 'Next' : 'Continue'}
            </Button>
          </Box>
        </Card>
      );
    }

    return null;
  };

  const columns: ColumnDefinition[] = [
    { field: 'clientName', headerName: 'Client Name', align: 'left', minWidth: 150 },
    { field: 'industryName', headerName: 'Industry Name', align: 'left', minWidth: 150 },
    { field: 'sanctionedLoadKw', headerName: 'Sanctioned Load (kW)', align: 'center', width: 140, valueFormatter: (v) => v ? Number(v).toLocaleString() : '-' },
    { field: 'stateCode', headerName: 'State', align: 'center', width: 80 },
    { field: 'discom', headerName: 'DISCOM', align: 'left', width: 120 },
    { field: 'consumerCategory', headerName: 'Category', align: 'left', width: 110 },
    { field: 'voltageLevel', headerName: 'Voltage', align: 'center', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      align: 'center',
      width: 220,
      renderCell: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<CalculateIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => handleOpenCalc(row)}
            sx={{ 
              fontSize: '11px', 
              py: 0.5, 
              borderColor: '#8B5CF6', 
              color: '#8B5CF6',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#7C3AED',
                bg: `${alpha('#8B5CF6', 0.05)}`
              }
            }}
          >
            Calculate
          </Button>
          <IconButton size="small" onClick={() => handleOpenDialog('view', row)} title="View Detail">
            <VisibilityIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </IconButton>
          <IconButton size="small" onClick={() => handleOpenDialog('edit', row)} title="Edit Entry">
            <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row.id)} title="Delete Entry">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 3 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2.5,
        pb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{
            color: '#8B5CF6',
            backgroundColor: `${alpha('#8B5CF6', 0.1)}`,
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalculateIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
              Savings Calculator
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Compare grid utility tariffs against energy market procurement clearing prices.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ 
            textTransform: 'none', 
            borderRadius: 2.5, 
            fontWeight: 600, 
            bgcolor: '#8B5CF6',
            '&:hover': {
              bgcolor: '#7C3AED'
            },
            px: 2.5,
            py: 1
          }}
        >
          Create New Entry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer
        title="Savings Calculator Entries"
        data={entries}
        columns={columns}
        loading={loading}
        emptyStateMessage={
          <EmptyTableState 
            title="No entries found" 
            description="Create your first client configuration entry to simulate and calculate savings."
            onAddRecord={() => handleOpenDialog('create')}
          />
        }
      />

      <Dialog 
        open={dialogMode !== null && !proltDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, pb: 1 }}>
          {dialogMode === 'create' && 'Create New Entry'}
          {dialogMode === 'edit' && 'Edit Entry'}
          {dialogMode === 'view' && 'View Entry Details'}
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, maxWidth: '600px', mx: 'auto', width: '100%', pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {dialogMode !== 'view' && (
            <Box sx={{ width: '100%', height: 6, bgcolor: '#F1F5F9', borderRadius: 3, mb: 1, overflow: 'hidden' }}>
              <Box sx={{ 
                width: `${((activeStep + 1) / 8) * 100}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', 
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
              }} />
            </Box>
          )}

          {renderStep(0, {
            icon: <BusinessIcon />,
            title: "Client & Facility Details",
            question: "Who is the client for this simulation?",
            summary: `Client: ${clientName} (${industryName})`,
            content: (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <TextField
                  label="Client Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Industry Name"
                  value={industryName}
                  onChange={(e) => setIndustryName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  variant="outlined"
                  size="small"
                />
              </Box>
            )
          })}

          {renderStep(1, {
            icon: <LocationIcon />,
            title: "Where is your facility located?",
            question: "Where is your facility located?",
            summary: `Location: ${stateCode} - ${uniqueStates.find(s => s.stateCode === stateCode)?.stateName || stateCode}`,
            content: (
              <Box sx={{ mt: 1 }}>
                <TextField
                  select
                  label="State Code"
                  value={stateCode}
                  onChange={(e) => {
                    setStateCode(e.target.value);
                    setDiscom('');
                    setConsumerCategory('');
                    setVoltageLevel('');
                    setSupplyVoltageValue('');
                  }}
                  fullWidth
                  variant="outlined"
                  size="small"
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <option value="" disabled>Select State</option>
                  {uniqueStates.map((s) => (
                    <option key={s.stateCode} value={s.stateCode}>
                      {s.stateCode} - {s.stateName}
                    </option>
                  ))}
                  {stateCode && !uniqueStates.some((s) => s.stateCode === stateCode) && (
                    <option value={stateCode}>{stateCode}</option>
                  )}
                </TextField>
              </Box>
            )
          })}

          {renderStep(2, {
            icon: <ElectricBoltIcon />,
            title: "Who is your electricity provider?",
            question: "Who is your electricity provider?",
            summary: `Provider: ${discom}`,
            content: (
              <Box sx={{ mt: 1 }}>
                <TextField
                  select
                  label="DISCOM"
                  value={discom}
                  onChange={(e) => setDiscom(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <option value="" disabled>Select DISCOM</option>
                  {filteredDiscoms.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.legalName}
                    </option>
                  ))}
                  {discom && !filteredDiscoms.some((d) => d.code === discom) && (
                    <option value={discom}>{discom}</option>
                  )}
                </TextField>
              </Box>
            )
          })}

          {renderStep(3, {
            icon: <CategoryIcon />,
            title: "What is your consumer category?",
            question: "What is your consumer category?",
            summary: `Category: ${consumerCategory}`,
            content: (
              <Box sx={{ mt: 1 }}>
                <TextField
                  select
                  label="Consumer Category"
                  value={consumerCategory}
                  onChange={(e) => setConsumerCategory(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <option value="" disabled>Select Category</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {consumerCategory && !uniqueCategories.includes(consumerCategory) && (
                    <option value={consumerCategory}>{consumerCategory}</option>
                  )}
                </TextField>
              </Box>
            )
          })}

          {renderStep(4, {
            icon: <BoltIcon />,
            title: "What is your voltage level?",
            question: "What is your voltage level?",
            summary: `Voltage Level: ${voltageLevel}${supplyVoltageValue ? ` - ${supplyVoltageValue}` : ''}`,
            content: (
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  select
                  label="Voltage Category"
                  value={voltageLevel}
                  onChange={(e) => {
                    setVoltageLevel(e.target.value);
                    setSupplyVoltageValue('');
                  }}
                  fullWidth
                  variant="outlined"
                  size="small"
                  SelectProps={{ native: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <option value="" disabled>Select Voltage</option>
                  {uniqueVoltageLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                  {voltageLevel && !uniqueVoltageLevels.includes(voltageLevel) && (
                    <option value={voltageLevel}>{voltageLevel}</option>
                  )}
                </TextField>

                {availableSupplyVoltageValues.length > 0 && (
                  <TextField
                    select
                    label="Supply Voltage Value (kV)"
                    value={supplyVoltageValue}
                    onChange={(e) => setSupplyVoltageValue(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    SelectProps={{ native: true }}
                    InputLabelProps={{ shrink: true }}
                  >
                    <option value="" disabled>Select Value</option>
                    {availableSupplyVoltageValues.map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </TextField>
                )}
              </Box>
            )
          })}

          {renderStep(5, {
            icon: <SpeedIcon />,
            title: "What is your sanctioned load?",
            question: "What is your sanctioned load?",
            summary: `Sanctioned Load: ${sanctionedLoadKw} kW`,
            content: (
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Sanctioned Load (kW)"
                  value={sanctionedLoadKw}
                  onChange={(e) => setSanctionedLoadKw(e.target.value)}
                  error={!!formErrors.sanctionedLoadKw}
                  helperText={formErrors.sanctionedLoadKw}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                />
              </Box>
            )
          })}

          {renderStep(6, {
            icon: <CalculateIcon />,
            title: "Energy Consumption per TOD Slab",
            question: "Select a month and enter your consumption (kWh) per TOD slab",
            summary: `TOD Consumptions set`,
            content: (
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    select
                    label="Year"
                    value={entryYear}
                    onChange={(e) => setEntryYear(Number(e.target.value))}
                    size="small"
                    SelectProps={{ native: true }}
                    sx={{ width: 120 }}
                  >
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </TextField>
                  <TextField
                    select
                    label="Month"
                    value={entryMonth}
                    onChange={(e) => setEntryMonth(Number(e.target.value))}
                    size="small"
                    SelectProps={{ native: true }}
                    sx={{ width: 150 }}
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </TextField>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const key = `${entryYear}-${String(entryMonth).padStart(2, '0')}`;
                      if (!todConsumptions[key]) {
                        setTodConsumptions(prev => ({ ...prev, [key]: {} }));
                      }
                    }}
                    sx={{ height: 40, textTransform: 'none', borderRadius: 2 }}
                  >
                    Add Month
                  </Button>
                </Box>
                
                {getTodSlabsForMonth(entryMonth).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Please select a State, DISCOM, and Category to see applicable TOD slabs.
                  </Typography>
                )}

                {Object.keys(todConsumptions).sort().map(ym => {
                  const targetMonth = parseInt(ym.split('-')[1], 10);
                  const monthSlabs = getTodSlabsForMonth(targetMonth);
                  
                  return (
                  <Card key={ym} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {new Date(`${ym}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => {
                        const newTc = { ...todConsumptions };
                        delete newTc[ym];
                        setTodConsumptions(newTc);
                      }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      {monthSlabs.map(slab => (
                        <Grid item xs={12} sm={6} key={slab}>
                          <TextField
                            label={`${slab} (kWh)`}
                            value={todConsumptions[ym][slab] || ''}
                            onChange={(e) => setTodConsumptions(prev => ({
                              ...prev,
                              [ym]: { ...prev[ym], [slab]: e.target.value }
                            }))}
                            fullWidth
                            variant="outlined"
                            size="small"
                            type="number"
                            placeholder="0"
                            sx={{ bgcolor: '#FFF' }}
                          />
                        </Grid>
                      ))}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Peak Demand (kVA)"
                          value={todConsumptions[ym]['Peak Demand (kVA)'] || ''}
                          onChange={(e) => setTodConsumptions(prev => ({
                            ...prev,
                            [ym]: { ...prev[ym], 'Peak Demand (kVA)': e.target.value }
                          }))}
                          fullWidth
                          variant="outlined"
                          size="small"
                          type="number"
                          placeholder="0"
                          sx={{ bgcolor: '#FFF' }}
                        />
                      </Grid>
                    </Grid>
                  </Card>

                  );
                })}
              </Box>
            )
          })}

          {dialogMode === 'view' && selectedEntry && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Created At:</strong> {new Date(selectedEntry.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Last Updated At:</strong> {new Date(selectedEntry.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
          {dialogMode === 'view' && selectedEntry && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Created At:</strong> {new Date(selectedEntry.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Last Updated At:</strong> {new Date(selectedEntry.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-start' }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PROLT Config Dialog */}
      <Dialog 
        open={proltDialogOpen} 
        onClose={() => setProltDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: '#F3E8FF', color: '#8B5CF6', p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalculateIcon fontSize="small" />
            </Box>
            Margin Details
          </Box>
          <IconButton onClick={() => setProltDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
            What are the margin rates for this client?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="PROLT Margin (Rs/kWh)"
              value={proltMargin}
              onChange={(e) => setProltMargin(e.target.value)}
              fullWidth
              type="number"
              variant="outlined"
              size="small"
            />
            <TextField
              label="Trader Margin (Rs/kWh)"
              value={traderMargin}
              onChange={(e) => setTraderMargin(e.target.value)}
              fullWidth
              type="number"
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setProltDialogOpen(false)} 
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setProltDialogOpen(false);
              handleSubmit();
            }}
            sx={{
              bgcolor: '#8B5CF6',
              '&:hover': { bgcolor: '#7C3AED' },
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            {dialogMode === 'edit' ? 'Save Entry' : 'Create Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={calcDialogOpen}
        onClose={handleCloseCalc}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CalculateIcon sx={{ color: '#8B5CF6' }} />
            <Typography variant="h2" sx={{ fontWeight: 700 }}>
              Savings Analysis for {calcEntry?.clientName}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseCalc}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ minHeight: '500px' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>

            <TextField
              select
              label="Simulation Month"
              value={selectedSimMonth}
              onChange={(e) => {
                setSelectedSimMonth(e.target.value);
                setCalcResult(null);
                setMarketDecisionResult(null);
              }}
              size="small"
              sx={{ width: 220, bgcolor: 'background.paper' }}
              SelectProps={{ native: true }}
            >
              {Object.keys(calcEntry?.todConsumptions || {}).sort().map((ym) => (
                <option key={ym} value={ym}>
                  {new Date(`${ym}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </TextField>

            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={executeCalculation}
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
              {calculating ? 'Analyzing...' : 'Run Simulation'}
            </Button>

            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={executeMarketDecision}
              disabled={calculatingMarket || !selectedSimMonth}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2, 
                bgcolor: '#10B981',
                '&:hover': {
                  bgcolor: '#059669'
                }
              }}
            >
              {calculatingMarket ? 'Analyzing...' : 'Market Buy Decision'}
            </Button>

            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={executeOASimulation}
              disabled={calculatingMarket || !selectedSimMonth}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2, 
                bgcolor: '#3B82F6',
                '&:hover': {
                  bgcolor: '#2563EB'
                }
              }}
            >
              {calculatingMarket ? 'Analyzing...' : 'Detailed OA Simulation'}
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
                    await exportSavingsExcel(calcEntry.id, selectedSimMonth || undefined);
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

          {(calculating || calculatingMarket) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} />
              <Typography variant="body2" color="text.secondary">
                {calculating ? 'Running cost simulations and sorting 15-minute slot metrics...' : 'Calculating market landing prices and comparing against grid tariffs...'}
              </Typography>
            </Box>
          )}

          {!calculating && !calculatingMarket && !calcResult && !marketDecisionResult && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Click 'Run Simulation' to load the landed cost analysis for your configured months.
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
                        {(marketDecisionResult ? marketDecisionResult.totalEnergyKwh : calcResult.totalEnergyKwh).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                      </Typography>
                      {marketDecisionResult?.todSummaries && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {marketDecisionResult.todSummaries.map((summary, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{summary.slabName}</Typography>
                              <Typography variant="caption" fontWeight={700}>{summary.totalEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</Typography>
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
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                      </Typography>
                      {marketDecisionResult?.todSummaries && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {marketDecisionResult.todSummaries.map((summary, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{summary.slabName}</Typography>
                              <Typography variant="caption" fontWeight={700} color="#16A34A">
                                {summary.marketEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                                {summary.marketCostBase !== undefined && ` • ₹${summary.marketCostBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
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
                  <Tab label="Slabs Group Summary (TOD Sorted)" disabled={!calcResult} />
                  <Tab label="Cheapest Month-wide Slots" disabled={!calcResult} />
                  <Tab label="Market Buy Decision" disabled={!marketDecisionResult} />
                  <Tab label="Detailed OA Simulation" disabled={!marketDecisionResult?.oaDetailed} />
                </Tabs>
              </Box>

              {calcTab === 0 && calcResult && (
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

              {calcTab === 1 && calcResult && (
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
                          <TableCell align="right">₹{row.optimizedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              
              {calcTab === 2 && marketDecisionResult && (
                <Box>
                  {marketDecisionResult.todSummaries && marketDecisionResult.todSummaries.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {marketDecisionResult.todSummaries.map((summary, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>
                                TOD: {summary.slabName}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Sourced:</Typography>
                                <Typography variant="body2" fontWeight={600}>{summary.totalEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: summary.marketCostBase !== undefined ? 0.5 : 0 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Market Sourced:</Typography>
                                <Typography variant="body2" fontWeight={600} color="#16A34A">{summary.marketEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</Typography>
                              </Box>
                              {summary.marketCostBase !== undefined && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Market Cost (MCP):</Typography>
                                  <Typography variant="body2" fontWeight={600} color="#16A34A">₹{summary.marketCostBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
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
                      {marketDecisionResult.slotsData.slice(0, 150).map((row: any, idx: number) => (
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
                              color: '#7C3AED',
                              backgroundColor: '#F5F3FF',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {row.marketSource}
                            </span>
                          </TableCell>
                          <TableCell align="right">₹{row.bestMarketLanding > 0 ? row.bestMarketLanding.toFixed(4) : '-'}</TableCell>
                          <TableCell align="right">₹{row.discomLanding.toFixed(4)}</TableCell>
                          <TableCell align="center">
                            {row.shouldBuyFromMarket ? (
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 800, 
                                color: '#16A34A',
                                backgroundColor: '#DCFCE7',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>YES</span>
                            ) : (
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 800, 
                                color: '#EF4444',
                                backgroundColor: '#FEE2E2',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>NO</span>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: row.savingsPerKwh > 0 ? '#16A34A' : '#EF4444' }}>
                            {row.savingsPerKwh > 0 ? '+' : ''}₹{row.savingsPerKwh.toFixed(4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                </Box>
              )}

              {calcTab === 3 && marketDecisionResult?.oaDetailed?.breakdown && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                    Detailed OA Savings Breakdown
                  </Typography>
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
                            <TableCell align="right">{row.discomUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</TableCell>
                            <TableCell align="right">{row.oaUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</TableCell>
                            <TableCell align="right">₹{row.discomBill.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell align="right">₹{row.proltDiscomBill.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell align="right">{row.consumerBusUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</TableCell>
                            <TableCell align="right">₹{row.oaBill.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.discomUnits, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.oaUnits, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.discomBill, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.proltDiscomBill, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.consumerBusUnits, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.oaBill, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 4, mt: 2, p: 2, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Daily Fixed Overhead (NLDC/SLDC)</Typography>
                      <Typography variant="body2" fontWeight={600}>₹{marketDecisionResult.oaDetailed.dailyFixedOverhead.toLocaleString()} ({marketDecisionResult.oaDetailed.totalDaysTraded} days)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Total Estimated OA Bill (Inc. Overheads)</Typography>
                      <Typography variant="body2" fontWeight={700} color="#7C3AED">
                        ₹{(
                          marketDecisionResult.oaDetailed.breakdown.reduce((sum, r) => sum + r.oaBill, 0) + 
                          marketDecisionResult.oaDetailed.dailyFixedOverhead + 
                          marketDecisionResult.oaDetailed.bidApplicationFees
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Total Gross Bill (Net Landed OA Cost)</Typography>
                      <Typography variant="body2" fontWeight={700} color="#E11D48">
                        ₹{(
                          marketDecisionResult.totalLandedExchangeCost + 
                          marketDecisionResult.oaDetailed.dailyFixedOverhead + 
                          marketDecisionResult.oaDetailed.bidApplicationFees
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseCalc} 
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
