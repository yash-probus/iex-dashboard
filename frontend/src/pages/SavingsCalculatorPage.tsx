import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, MenuItem, Button,
  Card, CardContent, Divider, Slider, InputAdornment, FormHelperText,
  Alert, Tooltip as MuiTooltip, alpha, useTheme
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Autorenew as AutorenewIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
  PieChart, Pie
} from 'recharts';
import { useResourceData } from '../hooks/useResourceData';
import { fetchMarketOperations } from '../api/marketOperations.api';
import { RegionState, StateTariff, StuCharges, IstsCharges, IexFees, ProltMargin } from './resource-center/types/resourceCenter.types';

// Robust default fallback arrays if the database is empty
const DEFAULT_STATES = [
  { stateName: 'Maharashtra', stateCode: 'MH' },
  { stateName: 'Gujarat', stateCode: 'GJ' },
  { stateName: 'Tamil Nadu', stateCode: 'TN' },
  { stateName: 'Karnataka', stateCode: 'KA' },
  { stateName: 'Andhra Pradesh', stateCode: 'AP' },
  { stateName: 'Uttar Pradesh', stateCode: 'UP' }
];

export default function SavingsCalculatorPage() {
  const theme = useTheme();

  // Fetching resource center data using existing hooks
  const { data: dbStates, loading: loadingStates } = useResourceData<RegionState>('region-state');
  const { data: dbTariffs, loading: loadingTariffs } = useResourceData<StateTariff>('state-tariff');
  const { data: dbStuCharges, loading: loadingStu } = useResourceData<StuCharges>('stu-charges');
  const { data: dbIstsCharges, loading: loadingIsts } = useResourceData<IstsCharges>('ists-charges');
  const { data: dbIexFees, loading: loadingIex } = useResourceData<IexFees>('iex-fees');
  const { data: dbProltMargins } = useResourceData<ProltMargin>('prolt-margin');

  // Unified Loading State
  const loadingData = loadingStates || loadingTariffs || loadingStu || loadingIsts || loadingIex;

  // 1. Selector States
  const [selectedState, setSelectedState] = useState<string>('MH');
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // Default July (Month 7)
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [voltageLevel, setVoltageLevel] = useState<string>('');

  // 2. Interactive Input Overrides
  const [utilityTariffRate, setUtilityTariffRate] = useState<number>(7.50);
  const [peakTodRate, setPeakTodRate] = useState<number>(1.50);
  const [offPeakTodRate, setOffPeakTodRate] = useState<number>(-1.00);

  // Market & MCP states
  const [marketType, setMarketType] = useState<'DAM' | 'RTM' | 'GDAM'>('DAM');
  const [averageMcp, setAverageMcp] = useState<number>(5.20);
  const [mcpSlider, setMcpSlider] = useState<number>(5.20);
  const [fetchingMcp, setFetchingMcp] = useState<boolean>(false);

  // Losses & Charges states
  const [istsLossPercent, setIstsLossPercent] = useState<number>(3.5);
  const [stuLossPercent, setStuLossPercent] = useState<number>(4.0);
  const [distLossPercent, setDistLossPercent] = useState<number>(4.5);
  const [stuCharges, setStuCharges] = useState<number>(0.35);
  const [distWheelingCharges, setDistWheelingCharges] = useState<number>(0.85);
  const [crossSubsidy, setCrossSubsidy] = useState<number>(1.60);
  const [additionalCharges, setAdditionalCharges] = useState<number>(1.10);

  // Margins, Fees & Taxes
  const [exchangeFee, setExchangeFee] = useState<number>(0.02);
  const [tradingMargin, setTradingMargin] = useState<number>(0.04);
  const [gstRate, setGstRate] = useState<number>(18); // GST % on fees & trading margins

  // Consumption profile
  const [totalConsumption, setTotalConsumption] = useState<number>(250000); // 250,000 kWh = 250 MWh
  const [consumptionUnit, setConsumptionUnit] = useState<'kWh' | 'MWh'>('kWh');
  const [todProfileType, setTodProfileType] = useState<'flat' | 'standard' | 'custom'>('standard');
  const [normalPercent, setNormalPercent] = useState<number>(60);
  const [peakPercent, setPeakPercent] = useState<number>(20);
  const [offPeakPercent, setOffPeakPercent] = useState<number>(20);

  // Get active states from DB or fallbacks
  const statesList = useMemo(() => {
    if (dbStates && dbStates.length > 0) {
      return dbStates.map(s => ({
        stateName: s.stateName,
        stateCode: s.stateCode || s.stateName.substring(0, 2).toUpperCase()
      }));
    }
    return DEFAULT_STATES;
  }, [dbStates]);

  // Dynamically extract lists for Category, Sub-Category, Voltage Level from the State Tariff matching stateCode
  const availableCategories = useMemo(() => {
    if (!dbTariffs || dbTariffs.length === 0) return ['Industrial', 'Commercial', 'Residential'];
    const filtered = dbTariffs.filter(t => t.stateCode === selectedState);
    const unique = Array.from(new Set(filtered.map(t => t.category).filter(Boolean)));
    return unique.length > 0 ? unique : ['Industrial', 'Commercial', 'Residential'];
  }, [dbTariffs, selectedState]);

  const availableSubCategories = useMemo(() => {
    if (!dbTariffs || dbTariffs.length === 0) return ['HT-I', 'HT-II', 'LT-I'];
    const filtered = dbTariffs.filter(t => t.stateCode === selectedState && t.category === category);
    const unique = Array.from(new Set(filtered.map(t => t.subCategory).filter(Boolean)));
    return unique.length > 0 ? unique : ['HT-I', 'HT-II', 'LT-I'];
  }, [dbTariffs, selectedState, category]);

  const availableVoltages = useMemo(() => {
    if (!dbTariffs || dbTariffs.length === 0) return ['11 kV', '33 kV', '66 kV', '132 kV'];
    const filtered = dbTariffs.filter(t => t.stateCode === selectedState && t.category === category && t.subCategory === subCategory);
    const unique = Array.from(new Set(filtered.map(t => t.voltageLevel).filter(Boolean)));
    return unique.length > 0 ? unique : ['11 kV', '33 kV', '66 kV', '132 kV'];
  }, [dbTariffs, selectedState, category, subCategory]);

  // Set default values for category, subCategory, and voltageLevel when state changes
  useEffect(() => {
    if (availableCategories.length > 0) {
      setCategory(prev => availableCategories.includes(prev) ? prev : availableCategories[0]);
    }
  }, [availableCategories]);

  useEffect(() => {
    if (availableSubCategories.length > 0) {
      setSubCategory(prev => availableSubCategories.includes(prev) ? prev : availableSubCategories[0]);
    }
  }, [availableSubCategories]);

  useEffect(() => {
    if (availableVoltages.length > 0) {
      setVoltageLevel(prev => availableVoltages.includes(prev) ? prev : availableVoltages[0]);
    }
  }, [availableVoltages]);

  // Auto-populate inputs based on selected state, category, subcategory, voltage level, and month
  useEffect(() => {
    if (loadingData) return;

    // 1. Fetch matching state tariff
    const matchingTariffs = dbTariffs.filter(t => 
      t.stateCode === selectedState &&
      t.category === category &&
      t.subCategory === subCategory &&
      t.voltageLevel === voltageLevel &&
      t.month === selectedMonth
    );

    if (matchingTariffs.length > 0) {
      // Average the energy charge over different TODs, but fetch specific TOD charges if they exist
      const normalTariff = matchingTariffs.find(t => t.tod.toLowerCase() === 'normal' || t.tod.toLowerCase() === 'base');
      const peakTariff = matchingTariffs.find(t => t.tod.toLowerCase() === 'peak');
      const offPeakTariff = matchingTariffs.find(t => t.tod.toLowerCase() === 'off-peak' || t.tod.toLowerCase() === 'offpeak');
      
      const defaultTariff = matchingTariffs[0].energyCharges || matchingTariffs[0].baseEnergyCharges || 7.50;
      setUtilityTariffRate(Number(normalTariff?.energyCharges || normalTariff?.baseEnergyCharges || defaultTariff));
      
      if (peakTariff) {
        setPeakTodRate(Number((peakTariff.energyCharges || peakTariff.baseEnergyCharges) - (normalTariff?.energyCharges || normalTariff?.baseEnergyCharges || defaultTariff)));
      } else {
        setPeakTodRate(1.50);
      }

      if (offPeakTariff) {
        setOffPeakTodRate(Number((offPeakTariff.energyCharges || offPeakTariff.baseEnergyCharges) - (normalTariff?.energyCharges || normalTariff?.baseEnergyCharges || defaultTariff)));
      } else {
        setOffPeakTodRate(-1.00);
      }
    } else {
      // Generic state level fallback
      setUtilityTariffRate(7.50);
      setPeakTodRate(1.50);
      setOffPeakTodRate(-1.00);
    }

    // 2. Fetch matching STU Charges
    const matchingStu = dbStuCharges.find(s => 
      s.stateCode === selectedState &&
      s.month === selectedMonth &&
      (!category || s.category === category)
    );

    if (matchingStu) {
      setStuLossPercent(Number(matchingStu.stuLossPercent || 4.0));
      setDistLossPercent(Number(matchingStu.distributionWheelingLossPercent || 4.5));
      setStuCharges(Number(matchingStu.stuChargesRsPerKwh || 0.35));
      setDistWheelingCharges(Number(matchingStu.distributionWheelingChargesRsPerKwh || 0.85));
      setCrossSubsidy(Number(matchingStu.crossSubsidy || 1.60));
      setAdditionalCharges(Number(matchingStu.additionalCharges || 1.10));
    } else {
      setStuLossPercent(4.0);
      setDistLossPercent(4.5);
      setStuCharges(0.35);
      setDistWheelingCharges(0.85);
      setCrossSubsidy(1.60);
      setAdditionalCharges(1.10);
    }

    // 3. Fetch ISTS Charges (Loss %)
    const matchingIsts = dbIstsCharges.find(i => i.state === selectedState);
    if (matchingIsts) {
      setIstsLossPercent(Number(matchingIsts.istsLossPercent || 3.5));
    } else {
      setIstsLossPercent(3.5);
    }

    // 4. Fetch IEX Fees
    const matchingIex = dbIexFees.find(f => f.month === selectedMonth);
    if (matchingIex) {
      setExchangeFee(Number(matchingIex.exchangeFees || 0.02));
    } else {
      setExchangeFee(0.02);
    }

    // 5. Fetch ProLT Margin
    if (dbProltMargins && dbProltMargins.length > 0) {
      const matchingMargin = dbProltMargins.find(m => m.month === selectedMonth);
      if (matchingMargin) {
        setTradingMargin(Number(matchingMargin.proltMargin || 0.04));
      } else {
        setTradingMargin(0.04);
      }
    } else {
      setTradingMargin(0.04);
    }

  }, [selectedState, selectedMonth, category, subCategory, voltageLevel, dbTariffs, dbStuCharges, dbIstsCharges, dbIexFees, dbProltMargins, loadingData]);

  // Fetch actual IEX Market Clearing Prices for selected month
  const fetchActualMcpData = async () => {
    try {
      setFetchingMcp(true);
      // Format start date and end date for that month in 2026
      const year = 2026;
      const startStr = `${year}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(selectedMonth).padStart(2, '0')}-${new Date(year, selectedMonth, 0).getDate()}`;
      
      const data = await fetchMarketOperations(startStr, endStr);
      if (data && data.length > 0) {
        let sum = 0;
        let count = 0;
        data.forEach(d => {
          let val = 0;
          if (marketType === 'DAM') val = Number(d.damMcp);
          else if (marketType === 'RTM') val = Number(d.rtmMcp);
          else if (marketType === 'GDAM') val = Number(d.gdamMcp);

          if (val > 0) {
            sum += val;
            count++;
          }
        });

        if (count > 0) {
          const avg = sum / count;
          setAverageMcp(Number(avg.toFixed(4)));
          setMcpSlider(Number(avg.toFixed(2)));
        } else {
          // If no non-zero values found, default based on market type
          const def = marketType === 'GDAM' ? 5.80 : 5.20;
          setAverageMcp(def);
          setMcpSlider(def);
        }
      } else {
        const def = marketType === 'GDAM' ? 5.80 : 5.20;
        setAverageMcp(def);
        setMcpSlider(def);
      }
    } catch (e) {
      console.error('Failed to fetch average MCP', e);
      const def = marketType === 'GDAM' ? 5.80 : 5.20;
      setAverageMcp(def);
      setMcpSlider(def);
    } finally {
      setFetchingMcp(false);
    }
  };

  // Fetch MCP average on load and when selected month or market type changes
  useEffect(() => {
    fetchActualMcpData();
  }, [selectedMonth, marketType]);

  // Synchronize averageMcp state with slider changes
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setMcpSlider(newValue as number);
    setAverageMcp(newValue as number);
  };

  const handleMcpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAverageMcp(val);
    setMcpSlider(val);
  };

  // TOD percentages logic
  const handleTodPercentChange = (zone: 'normal' | 'peak' | 'offPeak', val: number) => {
    const newPercent = Math.min(100, Math.max(0, val));
    if (zone === 'normal') {
      setNormalPercent(newPercent);
      // Adjust peak and off-peak proportionally to make total 100
      const remaining = 100 - newPercent;
      const currentSum = peakPercent + offPeakPercent;
      if (currentSum > 0) {
        setPeakPercent(Math.round((peakPercent / currentSum) * remaining));
        setOffPeakPercent(100 - newPercent - Math.round((peakPercent / currentSum) * remaining));
      } else {
        setPeakPercent(Math.round(remaining / 2));
        setOffPeakPercent(remaining - Math.round(remaining / 2));
      }
    } else if (zone === 'peak') {
      setPeakPercent(newPercent);
      const remaining = 100 - newPercent;
      const currentSum = normalPercent + offPeakPercent;
      if (currentSum > 0) {
        setNormalPercent(Math.round((normalPercent / currentSum) * remaining));
        setOffPeakPercent(100 - newPercent - Math.round((normalPercent / currentSum) * remaining));
      } else {
        setNormalPercent(Math.round(remaining / 2));
        setOffPeakPercent(remaining - Math.round(remaining / 2));
      }
    } else {
      setOffPeakPercent(newPercent);
      const remaining = 100 - newPercent;
      const currentSum = normalPercent + peakPercent;
      if (currentSum > 0) {
        setNormalPercent(Math.round((normalPercent / currentSum) * remaining));
        setPeakPercent(100 - newPercent - Math.round((normalPercent / currentSum) * remaining));
      } else {
        setNormalPercent(Math.round(remaining / 2));
        setPeakPercent(remaining - Math.round(remaining / 2));
      }
    }
  };

  // 3. Core Mathematics for Savings
  const mathResults = useMemo(() => {
    // Convert units to kWh
    const qtyKwh = consumptionUnit === 'MWh' ? totalConsumption * 1000 : totalConsumption;

    // Split consumption by TOD zones
    let normQty = qtyKwh;
    let peakQty = 0;
    let offPeakQty = 0;

    if (todProfileType === 'standard') {
      normQty = qtyKwh * 0.60;
      peakQty = qtyKwh * 0.20;
      offPeakQty = qtyKwh * 0.20;
    } else if (todProfileType === 'custom') {
      const sum = normalPercent + peakPercent + offPeakPercent;
      normQty = qtyKwh * (normalPercent / sum);
      peakQty = qtyKwh * (peakPercent / sum);
      offPeakQty = qtyKwh * (offPeakPercent / sum);
    }

    // 3.1 Utility Costs
    const utilityBaseCost = normQty * utilityTariffRate;
    const utilityPeakCost = peakQty * (utilityTariffRate + peakTodRate);
    const utilityOffPeakCost = offPeakQty * (utilityTariffRate + offPeakTodRate);
    const totalUtilityCost = utilityBaseCost + utilityPeakCost + utilityOffPeakCost;
    const avgUtilityTariff = totalUtilityCost / qtyKwh;

    // 3.2 Landed IEX Costs (open access math)
    // Loss compounding factor
    const istsMult = 1 / (1 - istsLossPercent / 100);
    const stuMult = 1 / (1 - stuLossPercent / 100);
    const distMult = 1 / (1 - distLossPercent / 100);
    const combinedLossFactor = istsMult * stuMult * distMult;

    const effectiveMcp = averageMcp * combinedLossFactor;
    const lossesComponent = effectiveMcp - averageMcp;

    // Exchange Fee and Trading Margin with GST
    const effectiveExchangeFee = exchangeFee * (1 + gstRate / 100);
    const effectiveTradingMargin = tradingMargin * (1 + gstRate / 100);

    const transmissionCharges = stuCharges + distWheelingCharges;
    const surcharges = crossSubsidy + additionalCharges;
    const marginsAndFees = effectiveExchangeFee + effectiveTradingMargin;

    const landedIexCostPerKwh = effectiveMcp + transmissionCharges + surcharges + marginsAndFees;
    const totalIexCost = qtyKwh * landedIexCostPerKwh;

    // 3.3 Savings summary
    const netSavings = totalUtilityCost - totalIexCost;
    const savingsPercent = (netSavings / totalUtilityCost) * 100;

    // 3.4 Break-even analysis
    const nonLossCharges = transmissionCharges + surcharges + marginsAndFees;
    const breakEvenMcp = (avgUtilityTariff - nonLossCharges) / combinedLossFactor;

    return {
      qtyKwh,
      normQty,
      peakQty,
      offPeakQty,
      totalUtilityCost,
      avgUtilityTariff,
      combinedLossFactor,
      effectiveMcp,
      lossesComponent,
      landedIexCostPerKwh,
      totalIexCost,
      netSavings,
      savingsPercent,
      breakEvenMcp,
      components: {
        mcp: averageMcp,
        losses: lossesComponent,
        transmission: transmissionCharges,
        surcharges: surcharges,
        fees: marginsAndFees
      }
    };
  }, [
    consumptionUnit, totalConsumption, todProfileType, normalPercent, peakPercent, offPeakPercent,
    utilityTariffRate, peakTodRate, offPeakTodRate,
    averageMcp, istsLossPercent, stuLossPercent, distLossPercent,
    stuCharges, distWheelingCharges, crossSubsidy, additionalCharges,
    exchangeFee, tradingMargin, gstRate
  ]);

  // 4. Data for Sensitivity Chart (Savings vs MCP)
  const sensitivityData = useMemo(() => {
    const range = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const qtyKwh = mathResults.qtyKwh;
    const totalUtilityCost = mathResults.totalUtilityCost;
    
    // Losses and charges variables
    const istsMult = 1 / (1 - istsLossPercent / 100);
    const stuMult = 1 / (1 - stuLossPercent / 100);
    const distMult = 1 / (1 - distLossPercent / 100);
    const combinedLossFactor = istsMult * stuMult * distMult;

    const transmissionCharges = stuCharges + distWheelingCharges;
    const surcharges = crossSubsidy + additionalCharges;
    const marginsAndFees = (exchangeFee + tradingMargin) * (1 + gstRate / 100);
    const nonLossCharges = transmissionCharges + surcharges + marginsAndFees;

    return range.map(mcp => {
      const landed = (mcp * combinedLossFactor) + nonLossCharges;
      const iexCost = qtyKwh * landed;
      const savings = totalUtilityCost - iexCost;
      const savingsLakhs = savings / 100000;
      return {
        mcp: `₹${mcp}`,
        mcpNum: mcp,
        Savings: Number(savingsLakhs.toFixed(2)),
        LandedCost: Number(landed.toFixed(2))
      };
    });
  }, [
    mathResults.qtyKwh, mathResults.totalUtilityCost,
    istsLossPercent, stuLossPercent, distLossPercent,
    stuCharges, distWheelingCharges, crossSubsidy, additionalCharges,
    exchangeFee, tradingMargin, gstRate
  ]);

  // Format utility cost display
  const formatCost = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const getMonthName = (m: number) => {
    return new Date(2026, m - 1).toLocaleString('default', { month: 'long' });
  };

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
              Compare state grid tariffs vs. buying open access power on IEX with full landed cost modeling.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<AutorenewIcon />}
          onClick={() => {
            setSelectedState('MH');
            setSelectedMonth(7);
            setTodProfileType('standard');
            fetchActualMcpData();
          }}
          sx={{ borderColor: 'divider', textTransform: 'none', borderRadius: 2.5, fontWeight: 600, color: 'text.secondary' }}
        >
          Reset Calculator
        </Button>
      </Box>

      {/* Main Grid: Inputs on Left, Analytics & Charts on Right */}
      <Grid container spacing={4}>
        {/* Left Column: Parameter configuration inputs */}
        <Grid item xs={12} lg={4.5} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BoltIcon sx={{ color: '#8B5CF6' }} /> Scenario Parameters
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="State"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  size="small"
                >
                  {statesList.map(s => (
                    <MenuItem key={s.stateCode} value={s.stateCode}>{s.stateName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Month (2026)"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  size="small"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <MenuItem key={m} value={m}>{getMonthName(m)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Consumer Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  size="small"
                  disabled={loadingData}
                >
                  {availableCategories.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Sub-Category"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  size="small"
                  disabled={loadingData}
                >
                  {availableSubCategories.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Voltage Level"
                  value={voltageLevel}
                  onChange={(e) => setVoltageLevel(e.target.value)}
                  size="small"
                  disabled={loadingData}
                >
                  {availableVoltages.map(v => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Utility Tariff overrides */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Grid Utility Tariff (₹/kWh)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
              Tariff rates are prefilled from state configurations. Modify them to override.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base Energy Charge"
                  value={utilityTariffRate}
                  onChange={(e) => setUtilityTariffRate(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="TOD Peak Extra"
                  value={peakTodRate}
                  onChange={(e) => setPeakTodRate(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="TOD Off-Peak Rebate"
                  value={offPeakTodRate}
                  onChange={(e) => setOffPeakTodRate(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* IEX Market Pricing and Slider */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                IEX Price Setup
              </Typography>
              <TextField
                select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value as any)}
                size="small"
                sx={{ width: 110 }}
              >
                <MenuItem value="DAM">DAM</MenuItem>
                <MenuItem value="RTM">RTM</MenuItem>
                <MenuItem value="GDAM">GDAM</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Average Market Price (MCP)"
                value={averageMcp}
                onChange={handleMcpInputChange}
                size="small"
                disabled={fetchingMcp}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  endAdornment: fetchingMcp ? <Box sx={{ display: 'flex', alignItems: 'center' }}><AutorenewIcon className="animate-spin" fontSize="small" /></Box> : null
                }}
              />
              <Button
                variant="outlined"
                onClick={fetchActualMcpData}
                disabled={fetchingMcp}
                sx={{ height: 40, whiteSpace: 'nowrap', textTransform: 'none', px: 2, borderRadius: 2 }}
              >
                Fetch DB Avg
              </Button>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Drag to analyze what-if MCP values:
            </Typography>
            <Slider
              value={mcpSlider}
              min={2}
              max={12}
              step={0.05}
              onChange={handleSliderChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `₹${v.toFixed(2)}`}
              sx={{ color: '#8B5CF6' }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
              <Typography variant="caption" color="text.secondary">₹2.00</Typography>
              <Typography variant="caption" color="text.secondary">₹12.00</Typography>
            </Box>
          </Paper>

          {/* Surcharges & Open Access losses */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Open Access Charges & Losses
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="ISTS Loss"
                  value={istsLossPercent}
                  onChange={(e) => setIstsLossPercent(Number(e.target.value))}
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="STU Loss"
                  value={stuLossPercent}
                  onChange={(e) => setStuLossPercent(Number(e.target.value))}
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Dist. Loss"
                  value={distLossPercent}
                  onChange={(e) => setDistLossPercent(Number(e.target.value))}
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="STU Charges"
                  value={stuCharges}
                  onChange={(e) => setStuCharges(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/kWh</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Dist. Wheeling"
                  value={distWheelingCharges}
                  onChange={(e) => setDistWheelingCharges(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/kWh</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cross Subsidy (CSS)"
                  value={crossSubsidy}
                  onChange={(e) => setCrossSubsidy(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/kWh</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Addl. Surcharge"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/kWh</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Exchange Fee"
                  value={exchangeFee}
                  onChange={(e) => setExchangeFee(Number(e.target.value))}
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Trading Margin"
                  value={tradingMargin}
                  onChange={(e) => setTradingMargin(Number(e.target.value))}
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="GST Rate"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Consumption profile configuration */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Consumption Profile
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monthly Consumption"
                  value={totalConsumption}
                  onChange={(e) => setTotalConsumption(Number(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  fullWidth
                  value={consumptionUnit}
                  onChange={(e) => setConsumptionUnit(e.target.value as any)}
                  size="small"
                >
                  <MenuItem value="kWh">kWh</MenuItem>
                  <MenuItem value="MWh">MWh</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="TOD Tariff Profile"
                  value={todProfileType}
                  onChange={(e) => setTodProfileType(e.target.value as any)}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="flat">Flat / Constant (100% Normal)</MenuItem>
                  <MenuItem value="standard">Standard Industrial (60% Normal, 20% Peak, 20% Off-Peak)</MenuItem>
                  <MenuItem value="custom">Custom Allocation</MenuItem>
                </TextField>
              </Grid>

              {todProfileType === 'custom' && (
                <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Normal Zone</Typography>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>{normalPercent}%</Typography>
                    </Box>
                    <Slider
                      value={normalPercent}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(e, v) => handleTodPercentChange('normal', v as number)}
                      sx={{ py: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Peak Zone (+₹{peakTodRate.toFixed(2)}/kWh)</Typography>
                      <Typography variant="body2" color="#FF7043" sx={{ fontWeight: 700 }}>{peakPercent}%</Typography>
                    </Box>
                    <Slider
                      value={peakPercent}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(e, v) => handleTodPercentChange('peak', v as number)}
                      sx={{ py: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Off-Peak Zone (₹{offPeakTodRate.toFixed(2)}/kWh rebate)</Typography>
                      <Typography variant="body2" color="#34B1AA" sx={{ fontWeight: 700 }}>{offPeakPercent}%</Typography>
                    </Box>
                    <Slider
                      value={offPeakPercent}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(e, v) => handleTodPercentChange('offPeak', v as number)}
                      sx={{ py: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Profile Check:</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: (normalPercent + peakPercent + offPeakPercent) === 100 ? 'success.main' : 'error.main'
                      }}
                    >
                      {normalPercent + peakPercent + offPeakPercent}% (Must equal 100%)
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column: Visual analytics, charts, sensitivity tables */}
        <Grid item xs={12} lg={7.5} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Summary cards row */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  background: `radial-gradient(circle at 100% 0%, ${alpha('#10B981', 0.12)} 0%, ${theme.palette.background.paper} 80%)`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Net Monthly Savings
                  </Typography>
                  <Box sx={{ p: 1, bgcolor: alpha(mathResults.netSavings >= 0 ? '#10B981' : '#EF4444', 0.1), borderRadius: 1.5 }}>
                    {mathResults.netSavings >= 0 ? (
                      <TrendingUpIcon sx={{ color: '#10B981' }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: '#EF4444' }} />
                    )}
                  </Box>
                </Box>
                <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 800, letterSpacing: '-1px' }}>
                  {formatCost(mathResults.netSavings)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: mathResults.netSavings >= 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    {mathResults.netSavings >= 0 ? '+' : ''}{mathResults.savingsPercent.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">savings on utility bill</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Break-Even IEX MCP
                  </Typography>
                  <Box sx={{ p: 1, bgcolor: alpha('#8B5CF6', 0.1), borderRadius: 1.5 }}>
                    <InfoIcon sx={{ color: '#8B5CF6' }} />
                  </Box>
                </Box>
                <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 800, letterSpacing: '-1px' }}>
                  ₹{mathResults.breakEvenMcp > 0 ? mathResults.breakEvenMcp.toFixed(2) : '0.00'}/kWh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {mathResults.breakEvenMcp > averageMcp ? (
                    <span>Current MCP is below break-even. Savings are active.</span>
                  ) : (
                    <span style={{ color: theme.palette.error.main }}>Current MCP is above break-even. Buying from IEX is more expensive!</span>
                  )}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Cost details breakdown cards */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Cost Comparison Breakdown
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    Utility Grid Supply
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                    {formatCost(mathResults.totalUtilityCost)}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Effective Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{mathResults.avgUtilityTariff.toFixed(2)}/kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Normal hours qty</Typography>
                      <Typography variant="body2">{(mathResults.normQty).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Peak hours qty</Typography>
                      <Typography variant="body2">{(mathResults.peakQty).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Off-peak hours qty</Typography>
                      <Typography variant="body2">{(mathResults.offPeakQty).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    IEX Open Access Supply
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, color: '#8B5CF6' }}>
                    {formatCost(mathResults.totalIexCost)}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Landed Cost Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#8B5CF6' }}>₹{mathResults.landedIexCostPerKwh.toFixed(2)}/kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Average MCP Price</Typography>
                      <Typography variant="body2">₹{mathResults.components.mcp.toFixed(2)}/kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">ISTS + STU + Dist. Losses</Typography>
                      <Typography variant="body2">₹{mathResults.components.losses.toFixed(2)}/kWh ({((mathResults.combinedLossFactor - 1) * 100).toFixed(1)}%)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Transmission & Wheeling</Typography>
                      <Typography variant="body2">₹{mathResults.components.transmission.toFixed(2)}/kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Surcharges (CSS + AS)</Typography>
                      <Typography variant="body2">₹{mathResults.components.surcharges.toFixed(2)}/kWh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Margins, Fees & Taxes</Typography>
                      <Typography variant="body2">₹{mathResults.components.fees.toFixed(2)}/kWh</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Visualizations - Side-by-Side Cost Bar Chart & Pie Chart */}
          <Grid container spacing={3.5}>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: 380, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                  Total Monthly Bill Comparison
                </Typography>
                <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Utility Grid', cost: Math.round(mathResults.totalUtilityCost) },
                        { name: 'IEX Open Access', cost: Math.round(mathResults.totalIexCost) }
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickFormatter={(v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total Cost']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="cost" radius={[8, 8, 0, 0]} maxBarSize={80}>
                        <Cell fill={theme.palette.primary.main} />
                        <Cell fill="#8B5CF6" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: 380, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  IEX Landed Cost Components
                </Typography>
                <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'IEX MCP', value: Number(mathResults.components.mcp.toFixed(2)) },
                          { name: 'Line Losses', value: Number(mathResults.components.losses.toFixed(2)) },
                          { name: 'Transmission', value: Number(mathResults.components.transmission.toFixed(2)) },
                          { name: 'Surcharges', value: Number(mathResults.components.surcharges.toFixed(2)) },
                          { name: 'Fees & Margin', value: Number(mathResults.components.fees.toFixed(2)) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#7C3AED" /> {/* MCP - Deep Purple */}
                        <Cell fill="#EF4444" /> {/* Losses - Red */}
                        <Cell fill="#3B8FF3" /> {/* Transmission - Blue */}
                        <Cell fill="#F59E0B" /> {/* Surcharges - Amber */}
                        <Cell fill="#10B981" /> {/* Fees - Green */}
                      </Pie>
                      <ChartTooltip
                        formatter={(value: any) => [`₹${Number(value).toFixed(2)}/kWh`, 'Rate']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Total indicator inside Donut */}
                  <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      ₹{mathResults.landedIexCostPerKwh.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      per kWh
                    </Typography>
                  </Box>
                </Box>
                {/* Legending */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                  {[
                    { label: 'MCP', color: '#7C3AED' },
                    { label: 'Losses', color: '#EF4444' },
                    { label: 'Trans.', color: '#3B8FF3' },
                    { label: 'Surch.', color: '#F59E0B' },
                    { label: 'Fees', color: '#10B981' }
                  ].map(leg => (
                    <Box key={leg.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: leg.color }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{leg.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Live Sensitivity Curve (Savings vs MCP) */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: 380, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Savings Sensitivity Model
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Plots monthly savings (₹ Lakhs) against various IEX MCP prices.
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="mcp" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    label={{ value: 'Savings (₹ Lakhs)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 11, fill: '#6B7280', fontWeight: 600 } }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Savings') return [`₹${value} Lakhs`, 'Net Savings'];
                      return [`₹${value}/kWh`, 'IEX Landed Cost'];
                    }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Savings" name="Savings" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="LandedCost" name="Landed Cost per kWh" stroke="#FF7043" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

        </Grid>
      </Grid>
    </Box>
  );
}
