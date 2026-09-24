import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, 
  MenuItem, Button, CircularProgress, Alert
} from '@mui/material';
import { apiClient } from '../api/client';

const STATES = [
  "Uttar Pradesh", "Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka"
]; // Add more as needed based on IEX options

const CATEGORIES = [
  "Industrial General", "Commercial", "Agriculture"
];

const VOLTAGES = ["11", "33", "132", "220"];

const TOD_MONTHS = ["Apr - Sept", "Oct - Mar", "All Months"];
const TOD_SLOTS = ["RTC (24 Hrs)", "Morning (06:00-10:00)", "Evening (18:00-22:00)"];

export default function LandingPriceCalcPage() {
  const [formData, setFormData] = useState({
    state: 'Uttar Pradesh',
    consumerCategory: 'Industrial General',
    voltage: '11',
    todMonth: 'Apr - Sept',
    todSlot: 'RTC (24 Hrs)',
    iexPrice: '4.5'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Build query string manually or pass as params
      const response = await apiClient.get('/landing-price-calc/calculate', {
        params: formData
      });
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Landing Price Calculator (IEX)
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
            >
              {STATES.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Consumer Category"
              name="consumerCategory"
              value={formData.consumerCategory}
              onChange={handleChange}
            >
              {CATEGORIES.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Voltage (kV)"
              name="voltage"
              value={formData.voltage}
              onChange={handleChange}
            >
              {VOLTAGES.map(v => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="TOD Month"
              name="todMonth"
              value={formData.todMonth}
              onChange={handleChange}
            >
              {TOD_MONTHS.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="TOD Slot"
              name="todSlot"
              value={formData.todSlot}
              onChange={handleChange}
            >
              {TOD_SLOTS.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="IEX Price (Rs/kWh)"
              name="iexPrice"
              type="number"
              inputProps={{ step: 0.1 }}
              value={formData.iexPrice}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleCalculate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Calculate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Calculation Result</Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              overflowX: 'auto',
              fontSize: '0.875rem'
            }}
          >
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
