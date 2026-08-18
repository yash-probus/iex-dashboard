import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Alert,
  Grid, Paper, Tooltip, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import EmptyTableState from '../components/dashboard/EmptyTableState';
import {
  fetchSavingsNewEntries,
  createSavingsNewEntry,
  updateSavingsNewEntry,
  deleteSavingsNewEntry,
  SavingsCalculatorNewEntry,
  CustomTodSlot
} from '../api/savingsCalculatorNew.api';

export default function SavingsCalculatorNewPage() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<SavingsCalculatorNewEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [address, setAddress] = useState('');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState('');
  const [stateCode, setStateCode] = useState('MH');
  const [discom, setDiscom] = useState('MSEDCL');
  const [consumerCategory, setConsumerCategory] = useState('Industrial');
  const [voltageLevel, setVoltageLevel] = useState('11 kV');

  // Custom TOD Consumptions per Month
  const [todConsumptions, setTodConsumptions] = useState<Record<string, CustomTodSlot[]>>({
    '2026-04': [
      { id: 'tod-1', name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 },
      { id: 'tod-2', name: 'Slot 2', startTime: '17:00', endTime: '23:00', consumptionKwh: 25000, effectivePrice: 9.20 }
    ]
  });

  const [activeMonth, setActiveMonth] = useState<string>('2026-04');
  const [newMonthInput, setNewMonthInput] = useState<string>('');

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSavingsNewEntries();
      setEntries(data || []);
    } catch (err: any) {
      console.error('Failed to load savings calculator new entries:', err);
      setError(err.message || 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedEntryId(null);
    setClientName('');
    setIndustryName('');
    setAddress('');
    setSanctionedLoadKw('1000');
    setStateCode('MH');
    setDiscom('MSEDCL');
    setConsumerCategory('Industrial');
    setVoltageLevel('11 kV');
    setTodConsumptions({
      '2026-04': [
        { id: 'tod-1', name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 },
        { id: 'tod-2', name: 'Slot 2', startTime: '17:00', endTime: '23:00', consumptionKwh: 25000, effectivePrice: 9.20 }
      ]
    });
    setActiveMonth('2026-04');
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: SavingsCalculatorNewEntry) => {
    setDialogMode('edit');
    setSelectedEntryId(entry.id);
    setClientName(entry.clientName);
    setIndustryName(entry.industryName);
    setAddress(entry.address);
    setSanctionedLoadKw(entry.sanctionedLoadKw ? String(entry.sanctionedLoadKw) : '');
    setStateCode(entry.stateCode || 'MH');
    setDiscom(entry.discom || 'MSEDCL');
    setConsumerCategory(entry.consumerCategory || 'Industrial');
    setVoltageLevel(entry.voltageLevel || '11 kV');

    const parsed: Record<string, CustomTodSlot[]> = {};
    if (entry.todConsumptions && typeof entry.todConsumptions === 'object') {
      Object.entries(entry.todConsumptions).forEach(([m, val]: [string, any]) => {
        if (Array.isArray(val)) {
          parsed[m] = val;
        } else if (val && typeof val === 'object' && Array.isArray(val.slots)) {
          parsed[m] = val.slots;
        } else {
          parsed[m] = [];
        }
      });
    }
    const months = Object.keys(parsed);
    setTodConsumptions(months.length > 0 ? parsed : {
      '2026-04': [
        { id: 'tod-1', name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 }
      ]
    });
    setActiveMonth(months[0] || '2026-04');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleAddTodSlot = () => {
    const currentSlots = todConsumptions[activeMonth] || [];
    const newSlotNumber = currentSlots.length + 1;
    const newSlot: CustomTodSlot = {
      id: `tod-${Date.now()}-${newSlotNumber}`,
      name: `Slot ${newSlotNumber}`,
      startTime: '08:00',
      endTime: '12:00',
      consumptionKwh: 5000,
      effectivePrice: 7.50
    };
    setTodConsumptions(prev => ({
      ...prev,
      [activeMonth]: [...(prev[activeMonth] || []), newSlot]
    }));
  };

  const handleRemoveTodSlot = (slotIndex: number) => {
    setTodConsumptions(prev => ({
      ...prev,
      [activeMonth]: (prev[activeMonth] || []).filter((_, idx) => idx !== slotIndex)
    }));
  };

  const handleUpdateTodSlot = (slotIndex: number, field: keyof CustomTodSlot, value: any) => {
    setTodConsumptions(prev => {
      const slots = [...(prev[activeMonth] || [])];
      if (slots[slotIndex]) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          [field]: field === 'consumptionKwh' || field === 'effectivePrice' ? (isNaN(Number(value)) ? 0 : Number(value)) : value
        };
      }
      return {
        ...prev,
        [activeMonth]: slots
      };
    });
  };

  const handleAddMonth = () => {
    if (!newMonthInput) return;
    if (!todConsumptions[newMonthInput]) {
      setTodConsumptions(prev => ({
        ...prev,
        [newMonthInput]: [
          { id: `tod-1`, name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 }
        ]
      }));
      setActiveMonth(newMonthInput);
      setNewMonthInput('');
    }
  };

  const handleSaveEntry = async () => {
    if (!clientName || !industryName || !address) {
      setError('Please fill in required fields (Client Name, Industry, Address).');
      return;
    }

    try {
      const payload = {
        clientName,
        industryName,
        address,
        sanctionedLoadKw: Number(sanctionedLoadKw) || 0,
        stateCode,
        discom,
        consumerCategory,
        voltageLevel,
        todConsumptions
      };

      if (dialogMode === 'create') {
        await createSavingsNewEntry(payload);
      } else if (selectedEntryId) {
        await updateSavingsNewEntry(selectedEntryId, payload);
      }

      setDialogOpen(false);
      loadEntries();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to save entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteSavingsNewEntry(id);
        loadEntries();
      } catch (err: any) {
        setError(err.message || 'Failed to delete entry');
      }
    }
  };

  const filteredEntries = entries.filter(e =>
    e.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.industryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.discom && e.discom.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: ColumnDefinition[] = [
    { field: 'clientName', headerName: 'Client Name', align: 'left' },
    { field: 'industryName', headerName: 'Industry', align: 'left' },
    { field: 'stateCode', headerName: 'State', align: 'center' },
    { field: 'discom', headerName: 'Discom', align: 'center' },
    { field: 'sanctionedLoadKw', headerName: 'Load (kW)', align: 'center', valueFormatter: (v) => v ? `${Number(v).toLocaleString()} kW` : '-' },
    {
      field: 'todConsumptions',
      headerName: 'Custom TOD Windows',
      align: 'center',
      renderCell: (row: SavingsCalculatorNewEntry) => {
        const months = Object.keys(row.todConsumptions || {});
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {months.map(m => (
              <Chip key={m} label={m} size="small" variant="outlined" color="primary" />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      align: 'center',
      renderCell: (row: SavingsCalculatorNewEntry) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Tooltip title="View Analysis">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/savings-calculator-new/${row.id}/analysis`)}
            >
              <BarChartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Entry">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleOpenEdit(row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Entry">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteEntry(row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            p: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center'
          }}>
            <CalculateIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Savings Calculator (New)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Calculate Open Access Savings with Custom TOD Start/End Timings and Direct Discom Effective Prices
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700 }}
        >
          New Client Entry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search & Action Bar */}
      <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search by client, industry, or discom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
          }}
        />
      </Paper>

      {/* Entries Table */}
      <TableContainer
        columns={columns}
        data={filteredEntries}
        loading={loading}
        emptyStateMessage={<EmptyTableState title="No entries found" description="Click 'New Client Entry' to add custom TOD calculation profile." />}
      />

      {/* Modal Dialog for Entry Creation/Editing */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {dialogMode === 'create' ? 'Create New Client Profile (Custom TOD)' : 'Edit Client Profile (Custom TOD)'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="subtitle2" color="primary" fontWeight={700}>
            1. Client & Load Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client Name *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Industry Name *"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Sanctioned Load (kW)"
                type="number"
                value={sanctionedLoadKw}
                onChange={(e) => setSanctionedLoadKw(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="State Code"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Discom"
                value={discom}
                onChange={(e) => setDiscom(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 1 }}>
            2. Custom TOD Timings & Effective Price Configuration
          </Typography>

          {/* Month Selector Tabs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {Object.keys(todConsumptions).map(m => (
              <Chip
                key={m}
                label={m}
                color={activeMonth === m ? 'primary' : 'default'}
                onClick={() => setActiveMonth(m)}
                sx={{ fontWeight: 600 }}
              />
            ))}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1 }}>
              <TextField
                placeholder="YYYY-MM (e.g. 2026-05)"
                size="small"
                value={newMonthInput}
                onChange={(e) => setNewMonthInput(e.target.value)}
                sx={{ width: 180 }}
              />
              <Button variant="outlined" size="small" onClick={handleAddMonth}>
                Add Month
              </Button>
            </Box>
          </Box>

          {/* Custom TOD Slots Table for Active Month */}
          <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Custom TOD Windows for {activeMonth}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddTodSlot}
              >
                Add TOD Slot
              </Button>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Slot Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Start Time (HH:MM)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">End Time (HH:MM)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Consumption (kWh)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Effective Price (₹/kWh)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(todConsumptions[activeMonth] || []).map((slot, idx) => (
                  <TableRow key={slot.id || idx}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={slot.name || ''}
                        onChange={(e) => handleUpdateTodSlot(idx, 'name', e.target.value)}
                        placeholder={`Slot ${idx + 1}`}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="time"
                        value={slot.startTime || '00:00'}
                        onChange={(e) => handleUpdateTodSlot(idx, 'startTime', e.target.value)}
                        inputProps={{ step: 300 }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="time"
                        value={slot.endTime || '24:00'}
                        onChange={(e) => handleUpdateTodSlot(idx, 'endTime', e.target.value)}
                        inputProps={{ step: 300 }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="number"
                        value={slot.consumptionKwh}
                        onChange={(e) => handleUpdateTodSlot(idx, 'consumptionKwh', e.target.value)}
                        sx={{ width: 130 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ step: 0.1 }}
                        value={slot.effectivePrice}
                        onChange={(e) => handleUpdateTodSlot(idx, 'effectivePrice', e.target.value)}
                        sx={{ width: 130 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleRemoveTodSlot(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEntry} variant="contained" color="primary">
            Save Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
