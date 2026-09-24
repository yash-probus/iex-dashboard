import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, 
  MenuItem, Button, CircularProgress, Alert
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../api/client';

const STATES = ["Daman & Diu","Uttar Pradesh","Arunachal Pradesh","Dadar Nagar Haveli","Maharashtra (MSEDCL)","Delhi (BRPL)","Telangana (NPDCL)","Maharashtra (BEST)","Andhra Pradesh (EPDCL)","Uttarakhand","Rajasthan","Jharkhand","Odisha (TPCODL)","Maharashtra (AEML)","Bihar","Gujarat","Punjab","Odisha (TPWODL)","Karnataka (BESCOM)","Himachal Pradesh","Telangana (SPDCL)","Odisha (TPSODL)","Delhi (TPDDL)","Kerala","Assam","Tamilnadu","West Bengal","Pondicherry","Delhi (BYPL)","Haryana","Madhya Pradesh","Maharashtra (TPC-D)","Chhattisgarh","Andhra Pradesh (CPDCL)","Andhra Pradesh (SPDCL)","Chandigarh","Goa","Odisha (TPNODL)","Meghalaya"];

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

  const [categories, setCategories] = useState<string[]>([]);
  const [voltages, setVoltages] = useState<string[]>([]);
  const [todMonths, setTodMonths] = useState<string[]>([]);
  const [todSlots, setTodSlots] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // 1. Fetch Categories based on State
  useEffect(() => {
    if (formData.state) {
      apiClient.get('/landing-price-calc/consumer-category', { params: { state: formData.state } })
        .then(res => {
          const data = res.data?.data || {};
          const vals = Object.values(data).map(String);
          setCategories(vals);
          if (!vals.includes(formData.consumerCategory)) {
            setFormData(prev => ({ ...prev, consumerCategory: vals[0] || '' }));
          }
        })
        .catch(console.error);
    } else {
      setCategories([]);
    }
  }, [formData.state]);

  // 2. Fetch Voltages based on State & Category
  useEffect(() => {
    if (formData.state && formData.consumerCategory) {
      apiClient.get('/landing-price-calc/voltage', { params: { state: formData.state, consumerCategory: formData.consumerCategory } })
        .then(res => {
          const data = res.data?.data || {};
          const vals = Object.values(data).map(String);
          setVoltages(vals);
          if (!vals.includes(formData.voltage)) {
            setFormData(prev => ({ ...prev, voltage: vals[0] || '' }));
          }
        })
        .catch(console.error);
    } else {
      setVoltages([]);
    }
  }, [formData.state, formData.consumerCategory]);

  // 3. Fetch TOD Months based on State, Category, Voltage
  useEffect(() => {
    if (formData.state && formData.consumerCategory && formData.voltage) {
      apiClient.get('/landing-price-calc/tod-months', { 
        params: { state: formData.state, consumerCategory: formData.consumerCategory, voltage: formData.voltage } 
      })
        .then(res => {
          const data = res.data?.data || {};
          const vals = Object.values(data).map(String);
          setTodMonths(vals);
          if (!vals.includes(formData.todMonth)) {
            setFormData(prev => ({ ...prev, todMonth: vals[0] || '' }));
          }
        })
        .catch(console.error);
    } else {
      setTodMonths([]);
    }
  }, [formData.state, formData.consumerCategory, formData.voltage]);

  // 4. Fetch TOD Slots based on State, Category, Voltage, Month
  useEffect(() => {
    if (formData.state && formData.consumerCategory && formData.voltage && formData.todMonth) {
      apiClient.get('/landing-price-calc/tod-slots', { 
        params: { state: formData.state, consumerCategory: formData.consumerCategory, voltage: formData.voltage, month: formData.todMonth } 
      })
        .then(res => {
          const data = res.data?.data || {};
          const vals = Object.values(data).map(String);
          setTodSlots(vals);
          if (!vals.includes(formData.todSlot)) {
            setFormData(prev => ({ ...prev, todSlot: vals[0] || '' }));
          }
        })
        .catch(console.error);
    } else {
      setTodSlots([]);
    }
  }, [formData.state, formData.consumerCategory, formData.voltage, formData.todMonth]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({
      state: 'Uttar Pradesh',
      consumerCategory: 'Commercial',
      voltage: '33',
      todMonth: 'Apr - Sept',
      todSlot: 'Normal (1000 - 1900 Hrs)',
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
                  {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>Voltage Level (kV)</Typography>
                <TextField select fullWidth size="small" name="voltage" value={formData.voltage} onChange={handleChange}>
                  {voltages.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>TOD Month</Typography>
                <TextField select fullWidth size="small" name="todMonth" value={formData.todMonth} onChange={handleChange}>
                  {todMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>TOD Slot</Typography>
                <TextField select fullWidth size="small" name="todSlot" value={formData.todSlot} onChange={handleChange}>
                  {todSlots.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
