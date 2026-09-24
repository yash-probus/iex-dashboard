import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, 
  MenuItem, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableRow, TableHead
} from '@mui/material';
import { apiClient } from '../api/client';

const STATES = [
  "Uttar Pradesh", "Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka"
];

const CATEGORIES = [
  "Industrial General", "Commercial", "Agriculture"
];

const VOLTAGES = ["11", "33", "132", "220"];

const TOD_MONTHS = ["Apr - Sept", "Oct - Mar", "All Months"];
const TOD_SLOTS = [
  "RTC (24 Hrs)", 
  "Morning (06:00-10:00)", 
  "Evening (18:00-22:00)",
  "Normal (1000 - 1900 Hrs)"
];

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
      const response = await apiClient.get('/landing-price-calc/calculate', {
        params: formData
      });
      if (response.data && response.data.data) {
        setResult(response.data.data);
      } else {
        setResult(response.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#27447f' }}>
        Landing Price Calculator
      </Typography>

      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select fullWidth label="State" name="state" value={formData.state} onChange={handleChange}>
              {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select fullWidth label="Consumer Category" name="consumerCategory" value={formData.consumerCategory} onChange={handleChange}>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select fullWidth label="Voltage (kV)" name="voltage" value={formData.voltage} onChange={handleChange}>
              {VOLTAGES.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select fullWidth label="TOD Month" name="todMonth" value={formData.todMonth} onChange={handleChange}>
              {TOD_MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select fullWidth label="TOD Slot" name="todSlot" value={formData.todSlot} onChange={handleChange}>
              {TOD_SLOTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="IEX Price (Rs/kWh)" name="iexPrice" type="number" inputProps={{ step: 0.1 }} value={formData.iexPrice} onChange={handleChange} />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleCalculate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                backgroundColor: '#27447f', 
                '&:hover': { backgroundColor: '#1a305e' },
                px: 4, py: 1.5, fontWeight: 'bold'
              }}
            >
              Calculate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Grid container spacing={4}>
          {/* Left Column: Open Access Charges */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#27447f', fontWeight: 'bold' }}>
                Open Access Charges (Rs./kWh)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>ISTS Charges</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.istsCharge ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>STU Charges</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.stuCharge ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Wheeling Charges</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.wheelingCharge ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Cross Subsidy Surcharge</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.crossSubsidyCharge ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Additional Surcharge</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.additionalSurcharge ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Other Charges*</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.otherCharges ?? '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Landed Cost (Rs./KWh):</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{result.landCost}</Typography>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Savings (Rs./KWh):</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{result.savings}</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Losses & Discom Tariff */}
          <Grid item xs={12} md={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: '#27447f', fontWeight: 'bold' }}>
                    OPEN ACCESS LOSSES (%)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>ISTS Losses :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.istsLoss}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>STU Losses :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.stuLoss}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Wheeling Losses :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.wheelingLoss}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, color: '#27447f', fontWeight: 'bold' }}>
                    DISCOM TARIFF** (RS./KWH)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Energy Charge :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.energyCharge}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>TOD Charge :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.todCharge}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Fuel Surcharge :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>{result.fsaCharge || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, borderBottom: 'none' }}>Total Charges :</TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none', fontWeight: 'bold' }}>{result.totalCharge}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
