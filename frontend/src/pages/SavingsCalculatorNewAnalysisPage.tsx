import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Card, CardContent, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon
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

export default function SavingsCalculatorNewAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<SavingsCalculatorNewEntry | null>(null);
  const [result, setResult] = useState<MarketDecisionResult | null>(null);
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

        const res = await calculateMarketDecisionNew(id, 'all');
        setResult(res);
      } catch (err: any) {
        console.error('Failed to load calculation analysis:', err);
        setError(err.message || 'Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
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

  const netSavings = result.totalSavings;
  const savingsPct = result.totalBaselineCost ? (netSavings / result.totalBaselineCost) * 100 : 0;

  const chartData = [
    { name: 'Discom Baseline', Cost: result.totalBaselineCost },
    { name: 'OA Optimized', Cost: result.totalOptimizedCost },
    { name: 'Net Savings', Cost: netSavings }
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/savings-calculator-new')}>
            Back
          </Button>
          <Typography variant="h5" fontWeight={700}>
            {entry.clientName} - Custom TOD Analysis
          </Typography>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #3B82F6' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                TOTAL DISCOM BASELINE COST
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                ₹{Math.round(result.totalBaselineCost).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #10B981' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                OPEN ACCESS OPTIMIZED COST
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1, color: 'success.main' }}>
                ₹{Math.round(result.totalOptimizedCost).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #8B5CF6' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                NET SAVINGS (₹)
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1, color: 'primary.main' }}>
                ₹{Math.round(netSavings).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #F59E0B' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                SAVINGS PERCENTAGE
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1, color: 'warning.main' }}>
                {savingsPct.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TOD Summaries Table */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Custom TOD Windows Breakdown
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
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Landed Cost Comparison (Discom vs Open Access)
        </Typography>
        <Box sx={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
              <Bar dataKey="Cost" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* 15-Minute Timeblock Level Data Table */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          15-Minute Timeblock Landed Cost & Sourcing Analysis
        </Typography>
        <TableContainer columns={columns} data={result.slotsData || []} />
      </Paper>
    </Box>
  );
}
