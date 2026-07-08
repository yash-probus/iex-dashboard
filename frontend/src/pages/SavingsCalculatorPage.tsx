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
  SavingsCalculatorEntry, 
  CalculationResult,
  CalculationSlotDetail
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
  const [todConsumptions, setTodConsumptions] = useState<Record<string, string>>({});
  
  // Validation Errors
  const [formErrors, setFormErrors] = useState<{ 
    clientName?: string; 
    industryName?: string; 
    address?: string;
    sanctionedLoadKw?: string;
  }>({});

  // Submitting States
  const [submitting, setSubmitting] = useState(false);

  // Calculation Dialog States
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);
  const [calcEntry, setCalcEntry] = useState<SavingsCalculatorEntry | null>(null);
  const [calcMonth, setCalcMonth] = useState<number>(7); // Default July
  const [calcYear, setCalcYear] = useState<number>(2026); // Default 2026
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcTab, setCalcTab] = useState(0);

  // Snackbar Notification State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch entries
  const [tariffData, setTariffData] = useState<any[]>([]);
  const [discomList, setDiscomList] = useState<any[]>([]);

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
      const [tariffRes, discomRes] = await Promise.all([
        getResourceData('state-tariff'),
        getResourceData('discom-list')
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

  // Memoized derived states
  const uniqueStates = React.useMemo(() => {
    const statesMap = new Map<string, string>();
    tariffData.forEach((row: any) => {
      if (row.stateCode) {
        statesMap.set(row.stateCode, row.state || row.stateCode);
      }
    });
    return Array.from(statesMap.entries()).map(([code, name]) => ({
      stateCode: code,
      stateName: name
    }));
  }, [tariffData]);

  const filteredDiscoms = React.useMemo(() => {
    const discomsSet = new Set<string>();
    tariffData.forEach((row: any) => {
      if (row.discom && (!stateCode || row.stateCode?.toLowerCase() === stateCode.trim().toLowerCase())) {
        discomsSet.add(row.discom);
      }
    });
    return Array.from(discomsSet).map(d => ({ code: d, legalName: d }));
  }, [tariffData, stateCode]);

  const uniqueCategories = React.useMemo(() => {
    const categoriesSet = new Set<string>();
    tariffData.forEach((row: any) => {
      if (row.category && (!stateCode || row.stateCode?.toLowerCase() === stateCode.trim().toLowerCase())) {
        categoriesSet.add(row.category);
      }
    });
    return Array.from(categoriesSet);
  }, [tariffData, stateCode]);

  const uniqueVoltageLevels = React.useMemo(() => {
    const levelsSet = new Set<string>([
      '11 kV', '11kV', '22 kV', '22kV', '33 kV', '33kV',
      '66 kV', '66kV', '110 kV', '110kV', '132 kV', '132kV',
      '220 kV', '220kV'
    ]);
    tariffData.forEach((row: any) => {
      if (row.voltageLevel && (!stateCode || row.stateCode?.toLowerCase() === stateCode.trim().toLowerCase())) {
        levelsSet.add(row.voltageLevel);
      }
    });
    return Array.from(levelsSet);
  }, [tariffData, stateCode]);

  const uniqueTodSlabs = React.useMemo(() => {
    const slabsSet = new Set<string>();
    tariffData.forEach((row: any) => {
      if (
        (!stateCode || row.stateCode?.toLowerCase() === stateCode.trim().toLowerCase()) &&
        (!discom || row.subCategory === discom) &&
        (!consumerCategory || row.category === consumerCategory) &&
        (!voltageLevel || row.voltageLevel === voltageLevel)
      ) {
        const slabName = (row.todName || row.tod || 'normal').toUpperCase();
        slabsSet.add(slabName);
      }
    });
    return Array.from(slabsSet).sort();
  }, [tariffData, stateCode, discom, consumerCategory, voltageLevel]);

  // Form Reset Helper
  const resetForm = () => {
    setClientName('');
    setIndustryName('');
    setAddress('');
    setSanctionedLoadKw('');
    setStateCode('');
    setDiscom('');
    setConsumerCategory('');
    setVoltageLevel('');
    setTodConsumptions({});
    setFormErrors({});
  };

  // Open Dialog
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
      setVoltageLevel(entry.voltageLevel || '');
      
      const tc: Record<string, string> = {};
      if (entry.todConsumptions) {
        Object.keys(entry.todConsumptions).forEach(k => {
          tc[k] = String(entry.todConsumptions![k]);
        });
      }
      setTodConsumptions(tc);
      
      setActiveStep(6); // Start at final step for edit mode
    } else {
      setSelectedEntry(null);
      resetForm();
      setActiveStep(0); // Start at step 0 for create mode
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
        return voltageLevel.trim() !== '';
      case 5:
        if (!sanctionedLoadKw.trim()) return false;
        const parsed = parseFloat(sanctionedLoadKw);
        return !isNaN(parsed) && parsed > 0;
      case 6:
        // Optional consumptions, but if provided should be valid numbers
        let isValid = true;
        Object.values(todConsumptions).forEach(val => {
          if (val.trim()) {
            const v = parseFloat(val);
            if (isNaN(v) || v < 0) isValid = false;
          }
        });
        return isValid;
      default:
        return false;
    }
  };

  // Close Dialog
  const handleCloseDialog = () => {
    setDialogMode(null);
    setSelectedEntry(null);
    resetForm();
  };

  // Validation
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

  // Handle Form Submit (Create or Edit)
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
        voltageLevel: voltageLevel.trim() || undefined,
        todConsumptions: Object.keys(todConsumptions).length > 0 ? 
          Object.fromEntries(Object.entries(todConsumptions).filter(([_, v]) => v.trim() !== '').map(([k, v]) => [k, parseFloat(v)])) 
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

  // Handle Delete Entry
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

  // Run Calculation Flow
  const handleOpenCalc = (entry: SavingsCalculatorEntry) => {
    setCalcEntry(entry);
    setCalcResult(null);
    setCalcDialogOpen(true);
    setCalcTab(0);
  };

  const handleCloseCalc = () => {
    setCalcDialogOpen(false);
    setCalcEntry(null);
    setCalcResult(null);
  };

  const executeCalculation = async () => {
    if (!calcEntry) return;
    try {
      setCalculating(true);
      const res = await calculateSavings(calcEntry.id, calcMonth, calcYear);
      setCalcResult(res);
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

  const exportCalcToCSV = () => {
    if (!calcResult || !calcResult.sortedMonthlyList) return;
    const exportData = calcResult.sortedMonthlyList.map((row) => ({
      'Date': row.date,
      'Timeblock': row.slot,
      'Time': row.timeStr,
      'TOD Slab': row.todSlab,
      'DAM Price (Rs/kWh)': row.damLandingPrice.toFixed(4),
      'DISCOM Landing Rate (Rs/kWh)': row.discomLandingPrice.toFixed(4),
      'Compared Lowest Price (Rs/kWh)': row.comparedLowestPrice.toFixed(4),
      'Sourced Energy (kWh)': row.maxEnergyPerSlot.toFixed(2),
      'Optimized Cost (Rs)': row.optimizedCost.toFixed(2),
      'Baseline DISCOM Cost (Rs)': row.baselineCost.toFixed(2),
      'Savings (Rs)': (row.baselineCost - row.optimizedCost).toFixed(2),
    }));
    
    const filename = `${calcResult.clientName}_savings_report_month_${calcResult.month}_${calcResult.year}.csv`;
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
                    handleSubmit();
                  }
                } else {
                  if (stepIndex === 5) {
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
              {stepIndex === 6 ? (dialogMode === 'edit' ? 'Save Entry' : 'Create Entry') : 'Continue'}
            </Button>
          </Box>
        </Card>
      );
    }

    return null;
  };

  // Define main table columns
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
      {/* Header section */}
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

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Table view */}
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

      {/* Dialog for Create / Edit / View */}
      <Dialog 
        open={dialogMode !== null} 
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
                width: `${((activeStep + 1) / 7) * 100}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', 
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
              }} />
            </Box>
          )}

          {/* Render steps */}
          {/* Step 0: Client details */}
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

          {/* Step 1: Location */}
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

          {/* Step 2: Provider */}
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

          {/* Step 3: Consumer Category */}
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

          {/* Step 4: Voltage Level */}
          {renderStep(4, {
            icon: <BoltIcon />,
            title: "What is your voltage level?",
            question: "What is your voltage level?",
            summary: `Voltage Level: ${voltageLevel}`,
            content: (
              <Box sx={{ mt: 1 }}>
                <TextField
                  select
                  label="Voltage Level"
                  value={voltageLevel}
                  onChange={(e) => setVoltageLevel(e.target.value)}
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
              </Box>
            )
          })}

          {/* Step 5: Sanctioned Load */}
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

          {/* Step 6: TOD Consumptions */}
          {renderStep(6, {
            icon: <CalculateIcon />,
            title: "Energy Consumption per TOD Slab",
            question: "Enter monthly consumption (kWh) per TOD slab (optional)",
            summary: `TOD Consumptions set`,
            content: (
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {uniqueTodSlabs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Please select a State, DISCOM, and Category to see applicable TOD slabs.
                  </Typography>
                )}
                {uniqueTodSlabs.map(slab => (
                  <TextField
                    key={slab}
                    label={`${slab} Consumption (kWh)`}
                    value={todConsumptions[slab] || ''}
                    onChange={(e) => setTodConsumptions(prev => ({ ...prev, [slab]: e.target.value }))}
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="number"
                    placeholder="e.g. 50000"
                  />
                ))}
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

      {/* Savings Calculation View Dialog */}
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
          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <TextField
              select
              size="small"
              label="Analysis Year"
              value={calcYear}
              onChange={(e) => setCalcYear(Number(e.target.value))}
              sx={{ width: 120 }}
              SelectProps={{ native: true }}
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </TextField>

            <TextField
              select
              size="small"
              label="Analysis Month"
              value={calcMonth}
              onChange={(e) => setCalcMonth(Number(e.target.value))}
              sx={{ width: 200 }}
              SelectProps={{ native: true }}
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
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={executeCalculation}
              disabled={calculating}
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
          </Box>

          {calculating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} />
              <Typography variant="body2" color="text.secondary">
                Running cost simulations and sorting 15-minute slot metrics...
              </Typography>
            </Box>
          )}

          {!calculating && !calcResult && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Select a month and click 'Run Simulation' to load landed cost analysis.
              </Typography>
            </Box>
          )}

          {calcResult && !calculating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {/* Summary KPIs */}
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Total Sourced Energy
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {calcResult.totalEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Baseline DISCOM Cost
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        ₹{calcResult.totalBaselineCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Landed Exchange Cost
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        ₹{calcResult.totalOptimizedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: '#C084FC', bgcolor: `${alpha('#8B5CF6', 0.04)}`, borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" color="#8B5CF6" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        Estimated Net Savings
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                        ₹{calcResult.totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Tabs for Details */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={calcTab} onChange={(e, v) => setCalcTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
                  <Tab label="Slabs Group Summary (TOD Sorted)" />
                  <Tab label="Cheapest Month-wide Slots" />
                </Tabs>
              </Box>

              {/* Tab Content 1: TOD Sorted Group blocks */}
              {calcTab === 0 && (
                <Grid container spacing={3}>
                  {Object.entries(calcResult.todGroups).map(([groupName, list]) => {
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

              {/* Tab Content 2: Month-wide Cheapest Slots */}
              {calcTab === 1 && (
                <Box sx={{ maxHeight: 400, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Time</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>TOD Slab</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>DAM Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>GDAM Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>RTM Price</TableCell>
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
