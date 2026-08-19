import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Card, CardContent, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Tabs, Tab, MenuItem, TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import {
  fetchSavingsNewEntryById,
  calculateMarketDecisionNew,
  SavingsCalculatorNewEntry,
  MarketDecisionResult
} from '../api/savingsCalculatorNew.api';
import { exportToCSV } from '../utils/export';

export default function SavingsCalculatorNewAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<SavingsCalculatorNewEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [result, setResult] = useState<MarketDecisionResult | null>(null);
  const [allMonthsResult, setAllMonthsResult] = useState<MarketDecisionResult | null>(null);
  const [monthlyResults, setMonthlyResults] = useState<Record<string, MarketDecisionResult>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const entryData = await fetchSavingsNewEntryById(id);
        setEntry(entryData);

        // Fetch All Months calculation
        const resAll = await calculateMarketDecisionNew(id, 'all');
        setAllMonthsResult(resAll);
        setResult(resAll);

        // Fetch calculation for each month configured
        const months = Object.keys(entryData.todConsumptions || {});
        const monthResultsMap: Record<string, MarketDecisionResult> = {};
        for (const m of months) {
          try {
            const resM = await calculateMarketDecisionNew(id, m);
            monthResultsMap[m] = resM;
          } catch (e) {
            console.warn(`Failed to calculate for month ${m}:`, e);
          }
        }
        setMonthlyResults(monthResultsMap);
      } catch (err: any) {
        console.error('Failed to load calculation analysis:', err);
        setError(err.message || 'Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleMonthChange = async (monthKey: string) => {
    setSelectedMonth(monthKey);
    if (monthKey === 'all') {
      setResult(allMonthsResult);
    } else if (monthlyResults[monthKey]) {
      setResult(monthlyResults[monthKey]);
    } else if (id) {
      setLoading(true);
      try {
        const resM = await calculateMarketDecisionNew(id, monthKey);
        setMonthlyResults(prev => ({ ...prev, [monthKey]: resM }));
        setResult(resM);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch calculation for month');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = () => {
    if (!result || !result.slotsData) return;
    const exportData = result.slotsData.map((row) => ({
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

    const clientNameStr = entry?.clientName ? entry.clientName.replace(/\s+/g, '_') : 'client';
    exportToCSV(exportData, `${clientNameStr}_custom_tod_analysis_${selectedMonth}.csv`);
  };

  if (loading && !entry) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  if (error || !entry || !result) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/savings-calculator-new')} sx={{ mb: 2 }}>
          Back to List
        </Button>
        <Alert severity="error">{error || 'Data not found'}</Alert>
      </Box>
    );
  }

  const configuredMonths = Object.keys(entry.todConsumptions || {});
  const netSavings = result.totalSavings || 0;
  const savingsPct = result.totalBaselineCost ? (netSavings / result.totalBaselineCost) * 100 : 0;

  const chartData = [
    { name: 'Discom Baseline', Cost: Math.round(result.totalBaselineCost) },
    { name: 'OA Optimized', Cost: Math.round(result.totalOptimizedCost) },
    { name: 'Net Savings', Cost: Math.round(netSavings) }
  ];

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Navigation Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/savings-calculator-new')}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', color: 'text.primary' }}
          >
            Back to Savings Calculator (New)
          </Button>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E293B' }}>
              Savings Analysis for {entry.clientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              State: {entry.stateCode} | DISCOM: {entry.discom} | Sanctioned Load: {entry.sanctionedLoadKw ? `${entry.sanctionedLoadKw} kW` : '-'}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700, bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
        >
          Export Simulation CSV
        </Button>
      </Box>

      {/* Month Selector Tabs */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 1 }}>
        <Tabs
          value={selectedMonth}
          onChange={(e, val) => handleMonthChange(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', borderRadius: 2, minHeight: 40 },
            '& .Mui-selected': { color: '#8B5CF6' },
            '& .MuiTabs-indicator': { backgroundColor: '#8B5CF6' }
          }}
        >
          <Tab value="all" label="All Months Summary" />
          {configuredMonths.map(m => (
            <Tab key={m} value={m} label={m} />
          ))}
        </Tabs>
      </Paper>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #3B82F6', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                TOTAL DISCOM BASELINE COST
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: '#1E293B' }}>
                ₹{Math.round(result.totalBaselineCost).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #10B981', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                OPEN ACCESS OPTIMIZED COST
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: '#10B981' }}>
                ₹{Math.round(result.totalOptimizedCost).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #8B5CF6', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                NET SAVINGS (₹)
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: '#8B5CF6' }}>
                ₹{Math.round(netSavings).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                SAVINGS PERCENTAGE
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: '#F59E0B' }}>
                {savingsPct.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TOD Summaries Table */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1E293B' }}>
          Custom TOD Windows Tariff & Cost Breakdown ({selectedMonth === 'all' ? 'All Months' : selectedMonth})
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>TOD Window Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Start Time</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">End Time</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Consumption (kWh)</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Discom Effective Price (₹/kWh)</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Discom Baseline Cost (₹)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(result.todSummaries || []).map((tod, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ fontWeight: 600 }}>{tod.slotName}</TableCell>
                <TableCell align="center">{tod.startTime}</TableCell>
                <TableCell align="center">{tod.endTime}</TableCell>
                <TableCell align="center">{tod.consumptionKwh.toLocaleString('en-IN')} kWh</TableCell>
                <TableCell align="center">₹{tod.effectivePrice.toFixed(2)}</TableCell>
                <TableCell align="center">₹{Math.round(tod.baselineCost).toLocaleString('en-IN')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Landed Cost Comparison Chart */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1E293B' }}>
          Landed Cost Comparison (Discom Baseline vs Open Access)
        </Typography>
        <Box sx={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
              <Bar dataKey="Cost" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* 15-Minute Timeblock Level Data Table */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1E293B' }}>
          15-Minute Timeblock Landed Cost & Sourcing Analysis
        </Typography>
        <TableContainer columns={columns} data={result.slotsData || []} />
      </Paper>
    </Box>
  );
}
