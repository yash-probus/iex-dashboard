import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Alert,
  Grid, Paper, Tooltip, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, MenuItem, FormControlLabel, RadioGroup, Radio, FormControl, FormLabel, Select, InputAdornment, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  ElectricBolt as ElectricBoltIcon,
  Category as CategoryIcon,
  Bolt as BoltIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TableContainer, { ColumnDefinition } from '../components/dashboard/TableContainer';
import EmptyTableState from '../components/dashboard/EmptyTableState';
import DateRangePicker from '../components/common/DateRangePicker';
import {
  fetchSavingsNewEntries,
  createSavingsNewEntry,
  updateSavingsNewEntry,
  deleteSavingsNewEntry,
  fetchResourceDefaults,
  SavingsCalculatorNewEntry,
  CustomTodSlot
} from '../api/savingsCalculatorNew.api';
import { getResourceData } from '../api/resourceCenter.api';

// Comprehensive Indian States & Discoms Master Data
const STATE_DISCOM_MASTER: Record<string, { name: string; discoms: { code: string; name: string }[] }> = {
  MH: {
    name: 'Maharashtra',
    discoms: [
      { code: 'MSEDCL', name: 'MSEDCL (Maharashtra State Electricity Distribution)' },
      { code: 'AEML', name: 'AEML (Adani Electricity Mumbai Limited)' },
      { code: 'TPC', name: 'Tata Power Company' },
      { code: 'BEST', name: 'BEST Undertaking' }
    ]
  },
  GJ: {
    name: 'Gujarat',
    discoms: [
      { code: 'DGVCL', name: 'DGVCL (Dakshin Gujarat Vij Company)' },
      { code: 'UGVCL', name: 'UGVCL (Uttar Gujarat Vij Company)' },
      { code: 'PGVCL', name: 'PGVCL (Paschim Gujarat Vij Company)' },
      { code: 'MGVCL', name: 'MGVCL (Madhya Gujarat Vij Company)' },
      { code: 'TORRENT', name: 'Torrent Power Ltd' }
    ]
  },
  UP: {
    name: 'Uttar Pradesh',
    discoms: [
      { code: 'NPCL', name: 'NPCL (Noida Power Company Limited)' },
      { code: 'PVVNL', name: 'PVVNL (Paschimanchal Vidyut Vitran)' },
      { code: 'DVVNL', name: 'DVVNL (Dakshinanchal Vidyut Vitran)' },
      { code: 'MVVNL', name: 'MVVNL (Madhyanchal Vidyut Vitran)' },
      { code: 'PUVVNL', name: 'PUVVNL (Purvanchal Vidyut Vitran)' },
      { code: 'KESCO', name: 'KESCO (Kanpur Electricity Supply Company)' }
    ]
  },
  DL: {
    name: 'Delhi',
    discoms: [
      { code: 'TPDDL', name: 'TPDDL (Tata Power Delhi Distribution)' },
      { code: 'BRPL', name: 'BRPL (BSES Rajdhani Power Limited)' },
      { code: 'BYPL', name: 'BYPL (BSES Yamuna Power Limited)' },
      { code: 'NDMC', name: 'NDMC (New Delhi Municipal Council)' }
    ]
  },
  KA: {
    name: 'Karnataka',
    discoms: [
      { code: 'BESCOM', name: 'BESCOM (Bangalore Electricity Supply)' },
      { code: 'MESCOM', name: 'MESCOM (Mangalore Electricity Supply)' },
      { code: 'CESC', name: 'CESC Mysuru' },
      { code: 'GESCOM', name: 'GESCOM (Gulbarga Electricity Supply)' },
      { code: 'HESCOM', name: 'HESCOM (Hubli Electricity Supply)' }
    ]
  },
  TN: {
    name: 'Tamil Nadu',
    discoms: [
      { code: 'TANGEDCO', name: 'TANGEDCO (Tamil Nadu Generation & Distribution)' }
    ]
  },
  HR: {
    name: 'Haryana',
    discoms: [
      { code: 'DHBVN', name: 'DHBVN (Dakshin Haryana Bijli Vitran Nigam)' },
      { code: 'UHBVN', name: 'UHBVN (Uttar Haryana Bijli Vitran Nigam)' }
    ]
  },
  PB: {
    name: 'Punjab',
    discoms: [
      { code: 'PSPCL', name: 'PSPCL (Punjab State Power Corporation)' }
    ]
  },
  JH: {
    name: 'Jharkhand',
    discoms: [
      { code: 'JBVNL', name: 'JBVNL (Jharkhand Bijli Vitran Nigam)' }
    ]
  },
  AS: {
    name: 'Assam',
    discoms: [
      { code: 'APDCL', name: 'APDCL (Assam Power Distribution Company)' }
    ]
  },
  RJ: {
    name: 'Rajasthan',
    discoms: [
      { code: 'JVVNL', name: 'JVVNL (Jaipur Vidyut Vitran Nigam)' },
      { code: 'AVVNL', name: 'AVVNL (Ajmer Vidyut Vitran Nigam)' },
      { code: 'JdVVNL', name: 'JdVVNL (Jodhpur Vidyut Vitran Nigam)' }
    ]
  },
  MP: {
    name: 'Madhya Pradesh',
    discoms: [
      { code: 'MPPKVVCL', name: 'MPPKVVCL (Paschim Kshetra)' },
      { code: 'MPMKVVCL', name: 'MPMKVVCL (Madhya Kshetra)' },
      { code: 'MPAKVVCL', name: 'MPAKVVCL (Purv Kshetra)' }
    ]
  },
  AP: {
    name: 'Andhra Pradesh',
    discoms: [
      { code: 'APSPDCL', name: 'APSPDCL (Southern Power Distribution)' },
      { code: 'APEPDCL', name: 'APEPDCL (Eastern Power Distribution)' },
      { code: 'APCPDCL', name: 'APCPDCL (Central Power Distribution)' }
    ]
  },
  TG: {
    name: 'Telangana',
    discoms: [
      { code: 'TSSPDCL', name: 'TSSPDCL (Southern Power Distribution)' },
      { code: 'TSNPDCL', name: 'TSNPDCL (Northern Power Distribution)' }
    ]
  },
  WB: {
    name: 'West Bengal',
    discoms: [
      { code: 'WBSEDCL', name: 'WBSEDCL (West Bengal State Electricity)' },
      { code: 'CESC_WB', name: 'CESC Kolkata' }
    ]
  },
  OD: {
    name: 'Odisha',
    discoms: [
      { code: 'TPCODL', name: 'TPCODL (TP Central Odisha Distribution)' },
      { code: 'TPNODL', name: 'TPNODL (TP Northern Odisha Distribution)' },
      { code: 'TPWODL', name: 'TPWODL (TP Western Odisha Distribution)' },
      { code: 'TPSODL', name: 'TPSODL (TP Southern Odisha Distribution)' }
    ]
  },
  CT: {
    name: 'Chhattisgarh',
    discoms: [
      { code: 'CSPDCL', name: 'CSPDCL (Chhattisgarh State Power Distribution)' }
    ]
  },
  UK: {
    name: 'Uttarakhand',
    discoms: [
      { code: 'UPCL', name: 'UPCL (Uttarakhand Power Corporation)' }
    ]
  },
  HP: {
    name: 'Himachal Pradesh',
    discoms: [
      { code: 'HPSEBL', name: 'HPSEBL (Himachal Pradesh State Electricity Board)' }
    ]
  },
  GA: {
    name: 'Goa',
    discoms: [
      { code: 'GED', name: 'GED (Goa Electricity Department)' }
    ]
  }
};

const CATEGORY_OPTIONS = [
  'Industrial',
  'Commercial',
  'HV-1',
  'HV-2',
  'HV-1 A',
  'HV-1 B',
  'LMV-11'
];

const VOLTAGE_OPTIONS = [
  '11 kV',
  '33 kV',
  '66 kV',
  '132 kV',
  '220 kV'
];

interface MonthTodData {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  peakDemandKw: number;
  slots: CustomTodSlot[];
}

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

  // Form Fields matching old UI
  const [clientPrefix, setClientPrefix] = useState('M/s');
  const [clientName, setClientName] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [address, setAddress] = useState('');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState('');
  const [sanctionedLoadKva, setSanctionedLoadKva] = useState('');
  const [stateCode, setStateCode] = useState('MH');
  const [discom, setDiscom] = useState('MSEDCL');
  const [consumerCategory, setConsumerCategory] = useState('Industrial');
  const [voltageLevel, setVoltageLevel] = useState('11 kV');

  // Margins & Fees Fields
  const [proltMargin, setProltMargin] = useState<string>('15');
  const [traderMargin, setTraderMargin] = useState<string>('0.02');
  const [meteringCharges, setMeteringCharges] = useState<string>('0');
  const [consultancyFee, setConsultancyFee] = useState<string>('0');
  const [probusPlatformFee, setProbusPlatformFee] = useState<string>('0');

  // Additional Billing & Tariff Fields
  const [applyElectricityDuty, setApplyElectricityDuty] = useState<boolean>(true);
  const [electricityDutyPercent, setElectricityDutyPercent] = useState<string>('5.00');
  const [fppaChargePercent, setFppaChargePercent] = useState<string>('10.00');
  const [demandChargeKwRate, setDemandChargeKwRate] = useState<string>('250.00');
  const [billedDemandKv, setBilledDemandKv] = useState<string>('');
  const [powerFactor, setPowerFactor] = useState<string>('0.99');
  const [arrearAmount, setArrearAmount] = useState<string>('0');
  const [currentLpsc, setCurrentLpsc] = useState<string>('0');

  // Master Data State
  const [apiStates, setApiStates] = useState<any[]>([]);
  const [apiDiscoms, setApiDiscoms] = useState<any[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [statesRes, discomsRes] = await Promise.all([
          getResourceData('region-state'),
          getResourceData('discom-list')
        ]);
        if (statesRes.success && statesRes.data) setApiStates(statesRes.data);
        if (discomsRes.success && discomsRes.data) setApiDiscoms(discomsRes.data);
      } catch (err) {
        console.warn('Using default master state/discom list:', err);
      }
    };
    fetchMasterData();
  }, []);

  const stateOptions = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(STATE_DISCOM_MASTER).forEach(([code, val]) => {
      map.set(code, `${code} - ${val.name}`);
    });
    apiStates.forEach(s => {
      if (s.stateCode && !map.has(s.stateCode)) {
        map.set(s.stateCode, `${s.stateCode} - ${s.stateName || s.stateCode}`);
      }
    });
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
  }, [apiStates]);

  const discomOptions = useMemo(() => {
    const list: { code: string; name: string }[] = [];
    if (STATE_DISCOM_MASTER[stateCode]) {
      list.push(...STATE_DISCOM_MASTER[stateCode].discoms);
    }
    apiDiscoms.filter(d => d.stateCode === stateCode).forEach(d => {
      const codeName = d.discom || d.code || d.legalName;
      if (codeName && !list.some(x => x.code === codeName)) {
        list.push({ code: codeName, name: d.legalName || codeName });
      }
    });

    if (discom && !list.some(x => x.code === discom)) {
      list.push({ code: discom, name: discom });
    }

    return list;
  }, [stateCode, discom, apiDiscoms]);

  // Custom TOD Consumptions & Billed Dates per Month
  const [todConsumptions, setTodConsumptions] = useState<Record<string, MonthTodData>>({
    '2026-04': {
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      peakDemandKw: 1000,
      slots: [
        { id: 'tod-1', name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 },
        { id: 'tod-2', name: 'Slot 2', startTime: '17:00', endTime: '23:00', consumptionKwh: 25000, effectivePrice: 9.20 }
      ]
    }
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

  useEffect(() => {
    if (!dialogOpen || dialogMode === 'edit') return;
    const loadResourceDefaults = async () => {
      try {
        const defaults = await fetchResourceDefaults({
          stateCode,
          discom,
          consumerCategory,
          voltageLevel,
          monthStr: activeMonth
        });
        if (defaults) {
          if (defaults.fppaChargePercent !== undefined) setFppaChargePercent(String(defaults.fppaChargePercent));
          if (defaults.demandChargeKwRate !== undefined) setDemandChargeKwRate(String(defaults.demandChargeKwRate));
          if (defaults.electricityDutyPercent !== undefined) setElectricityDutyPercent(String(defaults.electricityDutyPercent));
        }
      } catch (err) {
        console.warn('Could not load resource defaults:', err);
      }
    };
    loadResourceDefaults();
  }, [dialogOpen, dialogMode, stateCode, discom, consumerCategory, voltageLevel, activeMonth]);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedEntryId(null);
    setClientPrefix('M/s');
    setClientName('');
    setIndustryName('');
    setAddress('');
    setSanctionedLoadKw('1000');
    setSanctionedLoadKva('1111.11');
    setStateCode('MH');
    setDiscom('MSEDCL');
    setConsumerCategory('Industrial');
    setVoltageLevel('11 kV');
    setProltMargin('15');
    setTraderMargin('0.02');
    setMeteringCharges('0');
    setConsultancyFee('0');
    setProbusPlatformFee('0');
    setApplyElectricityDuty(true);
    setBilledDemandKv('');
    setPowerFactor('0.99');
    setArrearAmount('0');
    setCurrentLpsc('0');
    setTodConsumptions({
      '2026-04': {
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        peakDemandKw: 1000,
        slots: [
          { id: 'tod-1', name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 },
          { id: 'tod-2', name: 'Slot 2', startTime: '17:00', endTime: '23:00', consumptionKwh: 25000, effectivePrice: 9.20 }
        ]
      }
    });
    setActiveMonth('2026-04');
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: SavingsCalculatorNewEntry) => {
    setDialogMode('edit');
    setSelectedEntryId(entry.id);
    let fullClientName = entry.clientName || '';
    const matchedPrefix = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'M/s'].find(p => fullClientName.startsWith(`${p} `));
    if (matchedPrefix) {
      setClientPrefix(matchedPrefix);
      setClientName(fullClientName.substring(matchedPrefix.length + 1));
    } else {
      setClientPrefix('');
      setClientName(fullClientName);
    }
    setIndustryName(entry.industryName);
    setAddress(entry.address);

    const kwVal = entry.sanctionedLoadKw ? String(entry.sanctionedLoadKw) : '';
    setSanctionedLoadKw(kwVal);
    if (kwVal && !isNaN(Number(kwVal))) {
      setSanctionedLoadKva((Number(kwVal) / 0.9).toFixed(2).replace(/\.00$/, ''));
    } else {
      setSanctionedLoadKva('');
    }

    setStateCode(entry.stateCode || 'MH');
    setDiscom(entry.discom || 'MSEDCL');
    setConsumerCategory(entry.consumerCategory || 'Industrial');
    setVoltageLevel(entry.voltageLevel || '11 kV');
    setProltMargin(entry.proltMargin !== undefined && entry.proltMargin !== null 
      ? (Number(entry.proltMargin) <= 1 && Number(entry.proltMargin) > 0 ? String(Number(entry.proltMargin) * 100) : String(entry.proltMargin)) 
      : '15');
    setTraderMargin(entry.traderMargin !== undefined && entry.traderMargin !== null ? String(entry.traderMargin) : '0.02');
    setMeteringCharges(entry.meteringCharges !== undefined && entry.meteringCharges !== null ? String(entry.meteringCharges) : '0');
    setConsultancyFee(entry.consultancyFee !== undefined && entry.consultancyFee !== null ? String(entry.consultancyFee) : '0');
    setProbusPlatformFee(entry.probusPlatformFee !== undefined && entry.probusPlatformFee !== null ? String(entry.probusPlatformFee) : '0');
    setApplyElectricityDuty(entry.applyElectricityDuty !== undefined ? entry.applyElectricityDuty : true);
    setElectricityDutyPercent(entry.electricityDutyPercent !== undefined && entry.electricityDutyPercent !== null ? String(entry.electricityDutyPercent) : ((entry.todConsumptions as any)?._meta?.electricityDutyPercent !== undefined ? String((entry.todConsumptions as any)?._meta?.electricityDutyPercent) : '5.00'));
    setFppaChargePercent(entry.fppaChargePercent !== undefined && entry.fppaChargePercent !== null ? String(entry.fppaChargePercent) : ((entry.todConsumptions as any)?._meta?.fppaChargePercent !== undefined ? String((entry.todConsumptions as any)?._meta?.fppaChargePercent) : '10.00'));
    setDemandChargeKwRate(entry.demandChargeKwRate !== undefined && entry.demandChargeKwRate !== null ? String(entry.demandChargeKwRate) : ((entry.todConsumptions as any)?._meta?.demandChargeKwRate !== undefined ? String((entry.todConsumptions as any)?._meta?.demandChargeKwRate) : '250.00'));
    setBilledDemandKv(entry.billedDemandKv !== undefined && entry.billedDemandKv !== null ? String(entry.billedDemandKv) : '');
    setPowerFactor(entry.powerFactor !== undefined && entry.powerFactor !== null ? String(entry.powerFactor) : '0.99');
    setArrearAmount(entry.arrearAmount !== undefined && entry.arrearAmount !== null ? String(entry.arrearAmount) : '0');
    setCurrentLpsc(entry.currentLpsc !== undefined && entry.currentLpsc !== null ? String(entry.currentLpsc) : '0');

    const parsed: Record<string, MonthTodData> = {};
    if (entry.todConsumptions && typeof entry.todConsumptions === 'object') {
      Object.entries(entry.todConsumptions).forEach(([m, val]: [string, any]) => {
        if (m.startsWith('_') || !m.includes('-')) return;
        const [yearStr, monthStr] = m.split('-');
        const y = parseInt(yearStr, 10) || 2026;
        const mon = parseInt(monthStr, 10) || 4;
        const lastDay = new Date(y, mon, 0).getDate();

        if (Array.isArray(val)) {
          parsed[m] = {
            startDate: `${m}-01`,
            endDate: `${m}-${String(lastDay).padStart(2, '0')}`,
            peakDemandKw: Number(entry.sanctionedLoadKw || 1000),
            slots: val
          };
        } else if (val && typeof val === 'object') {
          parsed[m] = {
            startDate: val.startDate || `${m}-01`,
            endDate: val.endDate || `${m}-${String(lastDay).padStart(2, '0')}`,
            peakDemandKw: Number(val.peakDemandKw || entry.sanctionedLoadKw || 1000),
            slots: Array.isArray(val.slots) ? val.slots : []
          };
        }
      });
    }
    const validMonths = Object.keys(parsed);
    setTodConsumptions(validMonths.length > 0 ? parsed : {
      '2026-04': {
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        peakDemandKw: 1000,
        slots: [
          { id: 'tod-1', name: 'Peak Hours', startTime: '09:00', endTime: '12:00', consumptionKwh: 12000, effectivePrice: 9.20 },
          { id: 'tod-2', name: 'Off-Peak Hours', startTime: '22:00', endTime: '06:00', consumptionKwh: 25000, effectivePrice: 5.80 }
        ]
      }
    });
    setActiveMonth(validMonths.length > 0 ? validMonths[0] : '2026-04');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleAddTodSlot = () => {
    const currentMonthData = todConsumptions[activeMonth] || {
      startDate: `${activeMonth}-01`,
      endDate: `${activeMonth}-30`,
      peakDemandKw: Number(sanctionedLoadKw) || 1000,
      slots: []
    };
    const newSlotNumber = currentMonthData.slots.length + 1;
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
      [activeMonth]: {
        ...currentMonthData,
        slots: [...currentMonthData.slots, newSlot]
      }
    }));
  };

  const handleRemoveTodSlot = (slotIndex: number) => {
    setTodConsumptions(prev => {
      const cur = prev[activeMonth];
      if (!cur) return prev;
      return {
        ...prev,
        [activeMonth]: {
          ...cur,
          slots: cur.slots.filter((_, idx) => idx !== slotIndex)
        }
      };
    });
  };

  const handleUpdateTodSlot = (slotIndex: number, field: keyof CustomTodSlot, value: any) => {
    setTodConsumptions(prev => {
      const cur = prev[activeMonth];
      if (!cur) return prev;
      const slots = [...cur.slots];
      if (slots[slotIndex]) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          [field]: field === 'consumptionKwh' || field === 'effectivePrice' ? (isNaN(Number(value)) ? 0 : Number(value)) : value
        };
      }
      return {
        ...prev,
        [activeMonth]: {
          ...cur,
          slots
        }
      };
    });
  };

  const handleUpdateBilledDates = (startDate: string, endDate: string) => {
    setTodConsumptions(prev => {
      const cur = prev[activeMonth] || {
        startDate,
        endDate,
        peakDemandKw: Number(sanctionedLoadKw) || 1000,
        slots: []
      };
      return {
        ...prev,
        [activeMonth]: {
          ...cur,
          startDate,
          endDate
        }
      };
    });
  };

  const handleUpdatePeakDemand = (peakDemandKw: number) => {
    setTodConsumptions(prev => {
      const cur = prev[activeMonth] || {
        startDate: `${activeMonth}-01`,
        endDate: `${activeMonth}-30`,
        peakDemandKw,
        slots: []
      };
      return {
        ...prev,
        [activeMonth]: {
          ...cur,
          peakDemandKw
        }
      };
    });
  };

  const handleAddMonth = () => {
    if (!newMonthInput) return;
    if (!todConsumptions[newMonthInput]) {
      const [y, m] = newMonthInput.split('-');
      const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
      setTodConsumptions(prev => ({
        ...prev,
        [newMonthInput]: {
          startDate: `${newMonthInput}-01`,
          endDate: `${newMonthInput}-${String(lastDay).padStart(2, '0')}`,
          peakDemandKw: Number(sanctionedLoadKw) || 1000,
          slots: [
            { id: `tod-1`, name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 }
          ]
        }
      }));
      setActiveMonth(newMonthInput);
      setNewMonthInput('');
    }
  };

  const handleDeleteMonth = (monthToDelete: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const remainingMonths = Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-') && m !== monthToDelete);
    if (remainingMonths.length === 0 && !monthToDelete.startsWith('_')) {
      setError('At least one month entry is required.');
      return;
    }
    setTodConsumptions(prev => {
      const updated = { ...prev };
      delete updated[monthToDelete];
      return updated;
    });
    if (activeMonth === monthToDelete) {
      setActiveMonth(remainingMonths[0] || '2026-04');
    }
  };

  const handleSaveEntry = async () => {
    if (!clientName || !industryName || !address) {
      setError('Please fill in required fields (Client Name, Industry, Address).');
      return;
    }

    try {
      const formattedClientName = clientPrefix ? `${clientPrefix} ${clientName}` : clientName;
      const payload = {
        clientName: formattedClientName,
        industryName,
        address,
        sanctionedLoadKw: Number(sanctionedLoadKw) || 0,
        stateCode,
        discom,
        consumerCategory,
        voltageLevel,
        proltMargin: Number(proltMargin) || 0,
        traderMargin: Number(traderMargin) || 0,
        meteringCharges: Number(meteringCharges) || 0,
        consultancyFee: Number(consultancyFee) || 0,
        probusPlatformFee: Number(probusPlatformFee) || 0,
        applyElectricityDuty,
        electricityDutyPercent: Number(electricityDutyPercent) || 0,
        fppaChargePercent: Number(fppaChargePercent) || 0,
        demandChargeKwRate: Number(demandChargeKwRate) || 0,
        billedDemandKv: billedDemandKv ? Number(billedDemandKv) : null,
        powerFactor: powerFactor ? Number(powerFactor) : null,
        arrearAmount: arrearAmount ? Number(arrearAmount) : 0,
        currentLpsc: currentLpsc ? Number(currentLpsc) : 0,
        todConsumptions: {
          ...todConsumptions,
          _meta: {
            electricityDutyPercent: Number(electricityDutyPercent) || 0,
            fppaChargePercent: Number(fppaChargePercent) || 0,
            demandChargeKwRate: Number(demandChargeKwRate) || 0,
          }
        }
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
        const months = Object.keys(row.todConsumptions || {}).filter(m => !m.startsWith('_') && m.includes('-'));
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

  const activeMonthData = todConsumptions[activeMonth] || {
    startDate: `${activeMonth}-01`,
    endDate: `${activeMonth}-30`,
    peakDemandKw: Number(sanctionedLoadKw) || 1000,
    slots: []
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            backgroundColor: '#8B5CF6',
            color: 'white',
            p: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center'
          }}>
            <CalculateIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E293B' }}>
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
          sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 700, bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
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

      {/* Modal Dialog styled EXACTLY like the old Savings Calculator modal */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, bgcolor: '#F8FAFC' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, p: 3, pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
              {dialogMode === 'create' ? 'Create Client Profile (Custom TOD)' : 'Edit Client Profile (Custom TOD)'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter facility connection details, custom TOD windows, and tariff parameters
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, bgcolor: '#F8FAFC' }}>
          {/* Card 1: Client Details */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CategoryIcon sx={{ color: '#8B5CF6' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Client Information
              </Typography>
            </Box>

            <Grid container spacing= {2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client Name *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Select
                          value={clientPrefix}
                          onChange={(e) => setClientPrefix(e.target.value)}
                          variant="standard"
                          disableUnderline
                          sx={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary', mr: 1 }}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          <MenuItem value="Mr.">Mr.</MenuItem>
                          <MenuItem value="Ms.">Ms.</MenuItem>
                          <MenuItem value="Mrs.">Mrs.</MenuItem>
                          <MenuItem value="Dr.">Dr.</MenuItem>
                          <MenuItem value="M/s">M/s</MenuItem>
                        </Select>
                      </InputAdornment>
                    ),
                  }}
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
            </Grid>
          </Paper>

          {/* Card 2: Facility & Provider Location */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationIcon sx={{ color: '#8B5CF6' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                State, Provider & Tariff Category
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="State Code *"
                  value={stateCode}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setStateCode(newCode);
                    const firstDiscom = STATE_DISCOM_MASTER[newCode]?.discoms[0]?.code || '';
                    setDiscom(firstDiscom);
                  }}
                  fullWidth
                  size="small"
                >
                  {stateOptions.map((s) => (
                    <MenuItem key={s.code} value={s.code}>
                      {s.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="DISCOM *"
                  value={discom}
                  onChange={(e) => setDiscom(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {discomOptions.map((d) => (
                    <MenuItem key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Consumer Category *"
                  value={consumerCategory}
                  onChange={(e) => setConsumerCategory(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Voltage Category *"
                  value={voltageLevel}
                  onChange={(e) => setVoltageLevel(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {VOLTAGE_OPTIONS.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    label="Sanctioned Load (kW) *"
                    type="number"
                    value={sanctionedLoadKw}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSanctionedLoadKw(val);
                      if (val && !isNaN(Number(val))) {
                        setSanctionedLoadKva((Number(val) / 0.9).toFixed(2).replace(/\.00$/, ''));
                      } else {
                        setSanctionedLoadKva('');
                      }
                    }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Sanctioned Load (kVA)"
                    type="number"
                    value={sanctionedLoadKva}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSanctionedLoadKva(val);
                      if (val && !isNaN(Number(val))) {
                        setSanctionedLoadKw((Number(val) * 0.9).toFixed(2).replace(/\.00$/, ''));
                      } else {
                        setSanctionedLoadKw('');
                      }
                    }}
                    fullWidth
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Card 3: Margins & Fees */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ElectricBoltIcon sx={{ color: '#8B5CF6' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Margins & Platform Charges
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Electricity Duty (%)"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={electricityDutyPercent}
                  onChange={(e) => setElectricityDutyPercent(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="FPPA Surcharge (%)"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={fppaChargePercent}
                  onChange={(e) => setFppaChargePercent(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Demand Charge Rate (₹/kW/month)"
                  type="number"
                  inputProps={{ step: 1 }}
                  value={demandChargeKwRate}
                  onChange={(e) => setDemandChargeKwRate(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="PROLT Margin (% of Savings)"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={proltMargin}
                  onChange={(e) => setProltMargin(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Trader Margin (₹/kWh)"
                  type="number"
                  inputProps={{ step: 0.01 }}
                  value={traderMargin}
                  onChange={(e) => setTraderMargin(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Metering Charges (₹)"
                  type="number"
                  value={meteringCharges}
                  onChange={(e) => setMeteringCharges(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Consultancy Fee (₹)"
                  type="number"
                  value={consultancyFee}
                  onChange={(e) => setConsultancyFee(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Probus Platform Fee (₹)"
                  type="number"
                  value={probusPlatformFee}
                  onChange={(e) => setProbusPlatformFee(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Card 4: Monthly Custom TOD, Billed Dates & Peak Demand */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BoltIcon sx={{ color: '#8B5CF6' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Custom TOD Consumption & Billing Data
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  type="month"
                  size="small"
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  sx={{ width: 190 }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="outlined" size="small" onClick={handleAddMonth} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}>
                  Add Month
                </Button>
              </Box>
            </Box>

            {/* Month Chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-')).map(m => (
                <Chip
                  key={m}
                  label={m}
                  color={activeMonth === m ? 'primary' : 'default'}
                  onClick={() => setActiveMonth(m)}
                  onDelete={(e) => handleDeleteMonth(m, e)}
                  sx={{ fontWeight: 600, bgcolor: activeMonth === m ? '#8B5CF6' : undefined }}
                />
              ))}
            </Box>

            <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#8B5CF6', display: 'block', mb: 1.5 }}>
                Billing Data & Demand for {activeMonth}
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontSize: '12px', color: 'text.secondary', mb: 0.5 }}>Electricity Duty Applied?</FormLabel>
                    <RadioGroup
                      row
                      value={applyElectricityDuty ? 'Yes' : 'No'}
                      onChange={(e) => setApplyElectricityDuty(e.target.value === 'Yes')}
                    >
                      <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }} />} label={<Typography variant="body2">Yes</Typography>} />
                      <FormControlLabel value="No" control={<Radio size="small" sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }} />} label={<Typography variant="body2">No</Typography>} />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    BILLED CONSUMPTION DATE RANGE
                  </Typography>
                  <DateRangePicker
                    startDate={activeMonthData.startDate || `${activeMonth}-01`}
                    endDate={activeMonthData.endDate || `${activeMonth}-30`}
                    onChange={(start, end) => handleUpdateBilledDates(start, end)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Peak Demand (kW)"
                    type="number"
                    size="small"
                    fullWidth
                    value={activeMonthData.peakDemandKw || ''}
                    onChange={(e) => handleUpdatePeakDemand(Number(e.target.value))}
                    placeholder="e.g. 1000"
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Power Factor"
                    type="number"
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    value={powerFactor}
                    onChange={(e) => setPowerFactor(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Custom TOD Slots Table */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                Custom TOD Windows for {activeMonth}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddTodSlot}
                sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
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
                  <TableCell sx={{ fontWeight: 700 }} align="center">Consumption (kVAh)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Effective Price (₹/kWh)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeMonthData.slots || []).map((slot, idx) => {
                  const currentPf = (powerFactor && !isNaN(Number(powerFactor)) && Number(powerFactor) > 0) ? Number(powerFactor) : 0.9;
                  const kvahVal = slot.consumptionKwh ? (slot.consumptionKwh / currentPf).toFixed(2).replace(/\.00$/, '') : '';

                  return (
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
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="time"
                          value={slot.endTime || '24:00'}
                          onChange={(e) => handleUpdateTodSlot(idx, 'endTime', e.target.value)}
                          inputProps={{ step: 300 }}
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={slot.consumptionKwh}
                          onChange={(e) => handleUpdateTodSlot(idx, 'consumptionKwh', e.target.value)}
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={kvahVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !isNaN(Number(val))) {
                              handleUpdateTodSlot(idx, 'consumptionKwh', Math.round(Number(val) * currentPf));
                            } else {
                              handleUpdateTodSlot(idx, 'consumptionKwh', 0);
                            }
                          }}
                          sx={{ width: 110 }}
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
                );
              })}
              </TableBody>
            </Table>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
          <Button onClick={handleCloseDialog} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleSaveEntry} variant="contained" sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' }, fontWeight: 700 }}>
            Save Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
