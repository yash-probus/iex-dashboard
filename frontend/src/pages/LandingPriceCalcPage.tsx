import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, 
  MenuItem, Button, CircularProgress, Alert
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../api/client';

const STATES = ["Daman & Diu","Uttar Pradesh","Arunachal Pradesh","Dadar Nagar Haveli","Maharashtra (MSEDCL)","Delhi (BRPL)","Telangana (NPDCL)","Maharashtra (BEST)","Andhra Pradesh (EPDCL)","Uttarakhand","Rajasthan","Jharkhand","Odisha (TPCODL)","Maharashtra (AEML)","Bihar","Gujarat","Punjab","Odisha (TPWODL)","Karnataka (BESCOM)","Himachal Pradesh","Telangana (SPDCL)","Odisha (TPSODL)","Delhi (TPDDL)","Kerala","Assam","Tamilnadu","West Bengal","Pondicherry","Delhi (BYPL)","Haryana","Madhya Pradesh","Maharashtra (TPC-D)","Chhattisgarh","Andhra Pradesh (CPDCL)","Andhra Pradesh (SPDCL)","Chandigarh","Goa","Odisha (TPNODL)","Meghalaya"];
const CATEGORIES = ["Energy Intensive","Commercial","Industrial General"];
const VOLTAGES = ["11","33","132","110","220","66","22"];
const TOD_MONTHS = ["All Months","Apr - Sept","Apr - Oct","Oct - Mar","Jul - Aug","Feb-May","Nov-Jan","Sep-Oct","Sept - Jun","Nov - Mar","Apr - May","Jun - Sept","May-Jun"];
const TOD_SLOTS = ["Normal (0700 - 1800 hrs)","Off-Peak (2300 - 0500 hrs)","RTC (24 Hrs)","Off-Peak (2300 -0700 hrs)","Peak (1730 - 2100 hrs)","Normal (1100 - 1700 Hrs & 2300 - 0500 Hrs)","Peak (1400 - 1700 hrs)","Peak (1830 - 2200 Hrs)","Normal (0600 - 0700 hrs)","Normal (1200  - 1800 Hrs)","Normal (0500 - 1700 hrs)","Off-Peak (0000 - 0600 Hrs)","Normal (0600 - 1400 Hrs) & (1800 - 0000 Hrs)","Off-Peak (2200 - 0600 hrs)","Off-Peak (2200 - 0600 Hrs)","Normal (0600 - 1700 Hrs)","Peak (1700 - 2300 Hrs)","Off-Peak (0200 - 0600 Hrs)","Normal (0600 - 1830 Hrs)","Peak (0600 - 1000 Hrs & 1800 - 2200 Hrs)","Morning Peak (0600 - 1000 Hrs)","Normal (0600 - 1800 Hrs & 1800 - 2200 Hrs)","Peak (1800 - 2300 hrs)","Normal (1000 - 1800 Hrs)","Peak (0700 - 1100 hrs)","Morning Peak (0600 - 1000 hrs)","RTC (24 hrs)","Afternoon Off-Peak (1000 - 1500 hrs)","Off-Peak (2200 - 0500 Hrs)","Night Normal (22 - 24 hrs)","Peak (0900 - 1200 Hrs)","Afternoon Normal (1500 - 1800 hrs)","Normal (0500 - 1800 hrs)","Normal (0900 - 1800 Hrs)","Peak (1700 - 2200 hrs)","Off-Peak (0500 - 1100 Hrs)","Normal (0600 - 1000 Hrs)","Night Off-Peak (0000 - 0600 hrs)","Normal (1000 - 2400 Hrs & 2400 - 0200 Hrs)","Off-Peak (2100 - 0530 hrs)","Peak (1800 - 2200 Hrs)","Normal (0600 - 1800 hrs)","Normal (0700 - 1800 Hrs)","Off-Peak (2300 - 0600 Hrs)","Normal (0600 - 1700 hrs)","Night Normal (2200 - 2400 hrs)","Evening Peak (1800 - 2200 hrs)","Normal (0600 - 1800 Hrs & 2200 - 0600 Hrs)","Normal (1100 - 1700 Hrs & 0500 - 1100 Hrs)","Peak (2200 - 0100 hrs)","Off-Peak (1400 - 1800 Hrs)","Peak (0600 - 0900 Hrs)","Morning Peak (0600 - 0900 Hrs)","Evening Peak (1800 - 2300 Hrs)","Normal (0530 - 1730 hrs)","Normal (0900 - 1700 Hrs)","Peak (1800 - 2200 hrs)","Evening Peak (1800 - 2200 Hrs)","Peak (0600 - 1000 Hrs)","Normal (0500 - 0600 Hrs & 1000 - 1800 Hrs)","Normal (0600  - 0900 Hrs)","Off-Peak (2300 - 0500 Hrs)","Normal (1000 - 1400 hrs), (1700 - 2200 hrs) & (0100 - 0400 hrs)","Normal (1100 - 1800 hrs)","Peak (1700 - 2300 hrs)","Normal (0600 - 1800 Hrs)","Off-Peak (0400 -1000 hrs)"];

const COLORS = ['#007FFF', '#00C49F', '#FFBB28', '#FF8042', '#FF4444', '#8884d8'];

export default function LandingPriceCalcPage() {
  const [formData, setFormData] = useState({
    state: 'Uttar Pradesh',
    consumerCategory: 'Commercial',
    voltage: '33',
    todMonth: 'Apr - Sept',
    todSlot: 'Normal (1000 - 1900 Hrs)',
    iexPrice: '4'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({
      state: '',
      consumerCategory: '',
      voltage: '',
      todMonth: '',
      todSlot: '',
      iexPrice: ''
    });
    setResult(null);
    setError('');
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

  const pieData = result ? [
    { name: 'ISTS Charges', value: Number(result.istsCharge) || 0 },
    { name: 'STU Charges', value: Number(result.stuCharge) || 0 },
    { name: 'Wheeling Charges', value: Number(result.wheelingCharge) || 0 },
    { name: 'Cross Subsidy Surcharge', value: Number(result.crossSubsidyCharge) || 0 },
    { name: 'Additional Surcharge', value: Number(result.additionalSurcharge) || 0 },
    { name: 'Other Charges*', value: Number(result.otherCharges) || 0 },
  ].filter(item => item.value > 0) : [];

  return (
    <Box sx={{ 
      p: 4, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <Grid container spacing={3} sx={{ maxWidth: 1200 }}>
        
        {/* Left Column - Input Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 3, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>State (Discom)</Typography>
                <TextField select fullWidth size="small" name="state" value={formData.state} onChange={handleChange}>
                  {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>Consumer Category</Typography>
                <TextField select fullWidth size="small" name="consumerCategory" value={formData.consumerCategory} onChange={handleChange}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>Voltage Level (kV)</Typography>
                <TextField select fullWidth size="small" name="voltage" value={formData.voltage} onChange={handleChange}>
                  {VOLTAGES.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>TOD Month</Typography>
                <TextField select fullWidth size="small" name="todMonth" value={formData.todMonth} onChange={handleChange}>
                  {TOD_MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>TOD Slot</Typography>
                <TextField select fullWidth size="small" name="todSlot" value={formData.todSlot} onChange={handleChange}>
                  {TOD_SLOTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>IEX Price (Rs./unit)</Typography>
                <TextField fullWidth size="small" name="iexPrice" type="number" inputProps={{ step: 0.1 }} value={formData.iexPrice} onChange={handleChange} />
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleClear}
                  sx={{ 
                    borderColor: '#27447f', 
                    color: '#27447f',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  Clear
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleCalculate}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ 
                    backgroundColor: '#27447f', 
                    '&:hover': { backgroundColor: '#1a305e' },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - Results */}
        <Grid item xs={12} md={7}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          {result && (
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.05)', height: '100%' }}>
              <Typography variant="h5" sx={{ color: '#27447f', fontWeight: 'bold', mb: 4 }}>
                Open Access Charges (Rs./kWh)
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                  {[
                    { label: 'ISTS Charges', value: result.istsCharge },
                    { label: 'STU Charges', value: result.stuCharge },
                    { label: 'Wheeling Charges', value: result.wheelingCharge },
                    { label: 'Cross Subsidy Surcharge', value: result.crossSubsidyCharge },
                    { label: 'Additional Surcharge', value: result.additionalSurcharge },
                    { label: 'Other Charges*', value: result.otherCharges }
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pr: 4 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{item.value ?? 0}</Typography>
                    </Box>
                  ))}
                </Box>
                
                <Box sx={{ flex: 1, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({value}) => value}
                        labelLine={true}
                        isAnimationActive={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, height: '100%' }}>
                    <Typography sx={{ color: '#27447f', fontWeight: 'bold', mb: 2, fontSize: '14px' }}>
                      OPEN ACCESS LOSSES (%)
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>ISTS Losses :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.istsLoss}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>STU Losses :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.stuLoss}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Wheeling Losses :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.wheelingLoss}%</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, height: '100%' }}>
                    <Typography sx={{ color: '#27447f', fontWeight: 'bold', mb: 2, fontSize: '14px' }}>
                      DISCOM TARIFF** (RS./KWH)
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Energy Charge :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.energyCharge}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>TOD Charge :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.todCharge}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Fuel Surcharge :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.fsaCharge || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Total Charges :</Typography>
                      <Typography sx={{ fontSize: '14px' }}>{result.totalCharge}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Landed Cost (Rs./KWh) :</Typography>
                    <Typography sx={{ fontSize: '14px' }}>{result.landCost}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Savings (Rs./KWh) :</Typography>
                    <Typography sx={{ fontSize: '14px' }}>{result.savings}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
