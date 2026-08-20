import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Box, Paper, MenuItem, CircularProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

export interface CommercialProposalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialData?: {
    client_name?: string;
    industry_name?: string;
    sanctioned_load?: string | number;
    connectivity?: string;
    discom_name?: string;
    feeder_type?: string;
    traderMargin?: number;
    probusPlatformFee?: number;
    proltMargin?: number;
  };
}

const FEEDER_OPTIONS = [
  'Dedicated Feeder',
  'Mixed Feeder'
];

export default function CommercialProposalModal({
  open,
  onClose,
  onSubmit,
  initialData
}: CommercialProposalModalProps) {
  const [loading, setLoading] = useState(false);

  // Section 1: Facility Info
  const [clientName, setClientName] = useState('');
  const [sanctionedLoad, setSanctionedLoad] = useState('');
  const [connectivity, setConnectivity] = useState('');
  const [discomName, setDiscomName] = useState('');
  const [feederType, setFeederType] = useState('Dedicated Feeder');

  // Section 2: Fixed One-Time Costs
  const [abtSupplyCost, setAbtSupplyCost] = useState('450000');
  const [abtServiceCost, setAbtServiceCost] = useState('350000');
  const [utilityLiaisoningCost, setUtilityLiaisoningCost] = useState('300000');
  const [bankGuaranteeCost, setBankGuaranteeCost] = useState('150000');

  // Section 3: Fixed Recurring Charges
  const [iexAnnualFee, setIexAnnualFee] = useState('100000');
  const [sldcMonthlyNoc, setSldcMonthlyNoc] = useState('7000');
  const [st11Settlement, setSt11Settlement] = useState('20000');

  // Section 4: Probus Fees
  const [tradingMargin, setTradingMargin] = useState('2p/kWh');
  const [platformFee, setPlatformFee] = useState('2p/kWh');
  const [valueShare, setValueShare] = useState('15%');
  const [smartMeteringInfra, setSmartMeteringInfra] = useState('125000');

  useEffect(() => {
    if (open) {
      const name = initialData?.industry_name || initialData?.client_name || '';
      setClientName(name);

      const sLoad = initialData?.sanctioned_load ? String(initialData.sanctioned_load) : '1000 kW';
      setSanctionedLoad(sLoad.includes('kW') || sLoad.includes('kVA') ? sLoad : `${sLoad} kW`);

      setConnectivity(initialData?.connectivity || '11 kV');
      setDiscomName(initialData?.discom_name || 'PVVNL');
      setFeederType(initialData?.feeder_type || 'Dedicated Feeder');

      setAbtSupplyCost('450000');
      setAbtServiceCost('350000');
      setUtilityLiaisoningCost('300000');
      setBankGuaranteeCost('150000');

      setIexAnnualFee('100000');
      setSldcMonthlyNoc('7000');
      setSt11Settlement('20000');

      const tm = initialData?.traderMargin !== undefined ? `${initialData.traderMargin * 100}p/kWh` : '2p/kWh';
      const pf = initialData?.probusPlatformFee !== undefined ? `${initialData.probusPlatformFee * 100}p/kWh` : '2p/kWh';
      const vs = initialData?.proltMargin !== undefined ? `${initialData.proltMargin}%` : '15%';

      setTradingMargin(tm);
      setPlatformFee(pf);
      setValueShare(vs);
      setSmartMeteringInfra('125000');
    }
  }, [open, initialData]);

  const totalAbtSetup = (Number(abtSupplyCost) || 0) + (Number(abtServiceCost) || 0) + (Number(utilityLiaisoningCost) || 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        client_name: clientName,
        industry_name: clientName,
        sanctioned_load: sanctionedLoad,
        connectivity,
        discom_name: discomName,
        feeder_type: feederType,
        abt_supply_cost: Number(abtSupplyCost) || 450000,
        abt_service_cost: Number(abtServiceCost) || 350000,
        utility_liaisoning_cost: Number(utilityLiaisoningCost) || 300000,
        bank_guarantee_cost: Number(bankGuaranteeCost) || 150000,
        iex_annual_fee: Number(iexAnnualFee) || 100000,
        sldc_monthly_noc: Number(sldcMonthlyNoc) || 7000,
        st11_settlement: Number(st11Settlement) || 20000,
        trading_margin: tradingMargin,
        platform_fee: platformFee,
        value_share: valueShare,
        smart_metering_infra: Number(smartMeteringInfra) || 125000
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Error submitting commercial proposal form:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon sx={{ color: '#D97706' }} />
          <Typography variant="h6" fontWeight={700} color="#1E293B">
            Download Commercial Proposal
          </Typography>
        </Box>
        <Button onClick={onClose} size="small" color="inherit">
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {/* Section 1: Facility Parameters Table */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BusinessIcon sx={{ color: '#8B5CF6' }} />
            <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
              Client & Facility Details (Header Table)
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client / Industry Name"
                fullWidth
                size="small"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Sanctioned Load"
                fullWidth
                size="small"
                value={sanctionedLoad}
                onChange={(e) => setSanctionedLoad(e.target.value)}
                placeholder="e.g. 1000 kW"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Connectivity / Voltage"
                fullWidth
                size="small"
                value={connectivity}
                onChange={(e) => setConnectivity(e.target.value)}
                placeholder="e.g. 11 kV"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="DISCOM Name"
                fullWidth
                size="small"
                value={discomName}
                onChange={(e) => setDiscomName(e.target.value)}
                placeholder="e.g. PVVNL"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Feeder Type"
                fullWidth
                size="small"
                value={feederType}
                onChange={(e) => setFeederType(e.target.value)}
              >
                {FEEDER_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Fixed One-Time Costs */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon sx={{ color: '#D97706' }} />
              <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
                1. Fixed One-Time Cost
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', bgcolor: '#ECFDF5', px: 1.5, py: 0.5, borderRadius: 1 }}>
              Total ABT Setup: ₹{totalAbtSetup.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="1.1 ABT Meters Supply Cost (₹)"
                type="number"
                fullWidth
                size="small"
                value={abtSupplyCost}
                onChange={(e) => setAbtSupplyCost(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="1.2 Installation & Testing Service (₹)"
                type="number"
                fullWidth
                size="small"
                value={abtServiceCost}
                onChange={(e) => setAbtServiceCost(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="1.3 Utility Liaisoning & Consultancy (₹)"
                type="number"
                fullWidth
                size="small"
                value={utilityLiaisoningCost}
                onChange={(e) => setUtilityLiaisoningCost(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="1.5 UPSLDC Bank Guarantee / FDR (₹)"
                type="number"
                fullWidth
                size="small"
                value={bankGuaranteeCost}
                onChange={(e) => setBankGuaranteeCost(e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Fixed Recurring Charges */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SpeedIcon sx={{ color: '#2563EB' }} />
            <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
              2. Fixed Recurring Charges
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="2.1 IEX Annual Membership (₹)"
                type="number"
                fullWidth
                size="small"
                value={iexAnnualFee}
                onChange={(e) => setIexAnnualFee(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="2.2 UPSLDC Monthly NOC (₹)"
                type="number"
                fullWidth
                size="small"
                value={sldcMonthlyNoc}
                onChange={(e) => setSldcMonthlyNoc(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="2.3 ST-11 & Bill Settlement (₹)"
                type="number"
                fullWidth
                size="small"
                value={st11Settlement}
                onChange={(e) => setSt11Settlement(e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4: Probus Fees */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DescriptionIcon sx={{ color: '#059669' }} />
            <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
              3. Probus Fees
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="3.1 Trading Margin"
                fullWidth
                size="small"
                value={tradingMargin}
                onChange={(e) => setTradingMargin(e.target.value)}
                placeholder="e.g. 2p/kWh"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="3.2 Platform Fees"
                fullWidth
                size="small"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="e.g. 2p/kWh"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="3.3 Value Share"
                fullWidth
                size="small"
                value={valueShare}
                onChange={(e) => setValueShare(e.target.value)}
                placeholder="e.g. 15%"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="3.4 Smart Metering Infra Cost (₹)"
                type="number"
                fullWidth
                size="small"
                value={smartMeteringInfra}
                onChange={(e) => setSmartMeteringInfra(e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: '#FFFFFF' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
          sx={{
            bgcolor: '#D97706',
            '&:hover': { bgcolor: '#B45309' },
            fontWeight: 700,
            textTransform: 'none',
            px: 3
          }}
        >
          {loading ? 'Generating...' : 'Download Commercial Proposal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
