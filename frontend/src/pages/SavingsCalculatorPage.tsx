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
  Download as DownloadIcon
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

type DialogMode = 'create' | 'edit' | 'view' | null;

export default function SavingsCalculatorPage() {
  // State variables
  const [entries, setEntries] = useState<SavingsCalculatorEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedEntry, setSelectedEntry] = useState<SavingsCalculatorEntry | null>(null);
  
  // Form Fields State
  const [clientName, setClientName] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [address, setAddress] = useState('');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [discom, setDiscom] = useState('');
  const [consumerCategory, setConsumerCategory] = useState('');
  const [voltageLevel, setVoltageLevel] = useState('');
  
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

  useEffect(() => {
    loadEntries();
  }, []);

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
    } else {
      setSelectedEntry(null);
      resetForm();
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
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          {dialogMode === 'create' && 'Create New Entry'}
          {dialogMode === 'edit' && 'Edit Entry'}
          {dialogMode === 'view' && 'View Entry Details'}
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={3.5}>
            {/* Primary Details Column */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Primary Info
              </Typography>
              
              <TextField
                label="Client Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={dialogMode === 'view'}
                error={!!formErrors.clientName}
                helperText={formErrors.clientName}
                fullWidth
                required
                variant="outlined"
                size="small"
              />

              <TextField
                label="Industry Name"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
                disabled={dialogMode === 'view'}
                error={!!formErrors.industryName}
                helperText={formErrors.industryName}
                fullWidth
                required
                variant="outlined"
                size="small"
              />

              <TextField
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={dialogMode === 'view'}
                error={!!formErrors.address}
                helperText={formErrors.address}
                fullWidth
                required
                multiline
                rows={3}
                variant="outlined"
                size="small"
              />
            </Grid>

            {/* Sourcing & Tariff Parameters Column */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Grid & Load Parameters
              </Typography>

              <TextField
                label="Sanctioned Load (kW)"
                value={sanctionedLoadKw}
                onChange={(e) => setSanctionedLoadKw(e.target.value)}
                disabled={dialogMode === 'view'}
                error={!!formErrors.sanctionedLoadKw}
                helperText={formErrors.sanctionedLoadKw}
                fullWidth
                variant="outlined"
                size="small"
                type="number"
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="State Code"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g. MH, UP"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="DISCOM"
                    value={discom}
                    onChange={(e) => setDiscom(e.target.value)}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g. MSEDCL"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Consumer Category"
                    value={consumerCategory}
                    onChange={(e) => setConsumerCategory(e.target.value)}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g. HV-2, Industrial"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Voltage Level"
                    value={voltageLevel}
                    onChange={(e) => setVoltageLevel(e.target.value)}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g. 11 kV, 33 kV"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {dialogMode === 'view' && selectedEntry && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Created At:</strong> {new Date(selectedEntry.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Last Updated At:</strong> {new Date(selectedEntry.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={submitting}
              sx={{ 
                textTransform: 'none', 
                borderRadius: 2, 
                fontWeight: 600, 
                bgcolor: '#8B5CF6',
                '&:hover': {
                  bgcolor: '#7C3AED'
                }
              }}
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </Button>
          )}
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
              label="Analysis Month (2026)"
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
                  {Object.entries(calcResult.todGroups).map(([groupName, list]) => (
                    <Grid item xs={12} lg={4} key={groupName}>
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
                  ))}
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
