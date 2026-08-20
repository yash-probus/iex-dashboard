import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Alert, alpha, OutlinedInput, Card,
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
  ExpandMore as ExpandMoreIcon,
  AccountBalance as AccountBalanceIcon,
  History as HistoryIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon
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

function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getSlotIntervals(startTime: string, endTime: string): Array<[number, number]> {
  const s = parseTimeToMinutes(startTime);
  const e = parseTimeToMinutes(endTime);
  if (s === e) return [];
  if (s < e) return [[s, e]];
  return [[s, 1440], [0, e]]; // Cross-midnight
}

function doSlotsOverlap(slotA: { startTime: string; endTime: string }, slotB: { startTime: string; endTime: string }): boolean {
  const intA = getSlotIntervals(slotA.startTime, slotA.endTime);
  const intB = getSlotIntervals(slotB.startTime, slotB.endTime);
  for (const [s1, e1] of intA) {
    for (const [s2, e2] of intB) {
      if (Math.max(s1, s2) < Math.min(e1, e2)) return true;
    }
  }
  return false;
}

function getOverlappingSlotMap(slots: CustomTodSlot[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (doSlotsOverlap(slots[i], slots[j])) {
        if (!map.has(i)) map.set(i, []);
        if (!map.has(j)) map.set(j, []);
        map.get(i)!.push(j);
        map.get(j)!.push(i);
      }
    }
  }
  return map;
}

export default function SavingsCalculatorNewPage() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<SavingsCalculatorNewEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state & Step Wizard
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [todDialogOpen, setTodDialogOpen] = useState<boolean>(false);
  const [proltDialogOpen, setProltDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Form Fields matching old UI
  const [clientPrefix, setClientPrefix] = useState('M/s');
  const [clientName, setClientName] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [address, setAddress] = useState('');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState('');
  const [sanctionedLoadKva, setSanctionedLoadKva] = useState('');
  const [stateCode, setStateCode] = useState('UP');
  const [discom, setDiscom] = useState('MVVNL');
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
  const [apiTariffs, setApiTariffs] = useState<any[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [statesRes, discomsRes, tariffRes] = await Promise.all([
          getResourceData('region-state'),
          getResourceData('discom-list'),
          getResourceData('state-tariff')
        ]);
        if (statesRes.success && statesRes.data) setApiStates(statesRes.data);
        if (discomsRes.success && discomsRes.data) setApiDiscoms(discomsRes.data);
        if (tariffRes.success && tariffRes.data) setApiTariffs(tariffRes.data);
      } catch (err) {
        console.warn('Using default master state/discom list:', err);
      }
    };
    fetchMasterData();
  }, []);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    apiTariffs.forEach((row: any) => {
      const matchState = !stateCode ||
        row.state?.toLowerCase() === stateCode.trim().toLowerCase() ||
        (stateCode === 'UP' && row.state?.toLowerCase() === 'uttar pradesh');
      if (matchState && row.consumerCategory) {
        const sub = row.subCategory && row.subCategory.trim();
        if (sub && sub !== '-' && sub !== '') {
          set.add(`${row.consumerCategory} | ${sub}`);
        } else {
          set.add(row.consumerCategory);
        }
      }
    });

    if (set.size === 0) {
      CATEGORY_OPTIONS.forEach(cat => set.add(cat));
    }

    return Array.from(set);
  }, [apiTariffs, stateCode]);

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoryOptions.includes(consumerCategory)) {
      setConsumerCategory(categoryOptions[0]);
    }
  }, [categoryOptions]);

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

  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [activeMonth, setActiveMonth] = useState<string>('2026-04');
  const [newMonthInput, setNewMonthInput] = useState<string>(getCurrentYearMonth());
  const [entryYear, setEntryYear] = useState<number>(2026);
  const [entryMonth, setEntryMonth] = useState<number>(4);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('2026-04');

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
    setStateCode('UP');
    setDiscom('MVVNL');
    setConsumerCategory(categoryOptions[0] || 'HV-2 | Urban Schedule (Large & Heavy Power)');
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
    setNewMonthInput(getCurrentYearMonth());
    setActiveStep(0);
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: SavingsCalculatorNewEntry) => {
    setDialogMode('edit');
    setSelectedEntryId(entry.id);
    setActiveStep(0);
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
    const slots = currentMonthData.slots || [];
    const newSlotNumber = slots.length + 1;

    let defaultStart = '08:00';
    let defaultEnd = '12:00';
    if (slots.length > 0) {
      const lastSlot = slots[slots.length - 1];
      if (lastSlot.endTime) {
        defaultStart = lastSlot.endTime;
        const [h, m] = defaultStart.split(':').map(Number);
        const endH = (h + 4) % 24;
        defaultEnd = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      }
    }

    const newSlot: CustomTodSlot = {
      id: `tod-${Date.now()}-${newSlotNumber}`,
      name: `Slot ${newSlotNumber}`,
      startTime: defaultStart,
      endTime: defaultEnd,
      consumptionKwh: 5000,
      effectivePrice: 7.50
    };
    setTodConsumptions(prev => ({
      ...prev,
      [activeMonth]: {
        ...currentMonthData,
        slots: [...slots, newSlot]
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
      setNewMonthInput(getCurrentYearMonth());
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

    // Overlap validation check across all months
    for (const [ym, monthData] of Object.entries(todConsumptions)) {
      if (!ym.startsWith('_') && ym.includes('-')) {
        const slots = (monthData.slots || []) as CustomTodSlot[];
        const overlapMap = getOverlappingSlotMap(slots);
        if (overlapMap.size > 0) {
          const firstOverlapIdx = Array.from(overlapMap.keys())[0];
          const overlappedIndices = overlapMap.get(firstOverlapIdx) || [];
          const slotName = slots[firstOverlapIdx]?.name || `Slot ${firstOverlapIdx + 1}`;
          const overlappedSlotNames = overlappedIndices.map(i => slots[i]?.name || `Slot ${i + 1}`).join(', ');
          setError(`Cannot save entry: Custom TOD slots in month ${ym} have overlapping time ranges (${slotName} overlaps with ${overlappedSlotNames}). Please adjust start/end times so each TOD slot has a distinct time window.`);
          setActiveMonth(ym);
          return;
        }
      }
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
      setTodDialogOpen(false);
      setProltDialogOpen(false);
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
    {
      field: 'id',
      headerName: 'CLIENT ID',
      align: 'center',
      width: 90,
      sticky: true,
      renderCell: (row: SavingsCalculatorNewEntry) => {
        const index = filteredEntries.findIndex(e => e.id === row.id);
        return index >= 0 ? index + 1 : 1;
      }
    },
    { field: 'clientName', headerName: 'CLIENT NAME', align: 'left', minWidth: 150, sticky: true, sortable: true },
    { field: 'industryName', headerName: 'INDUSTRY NAME', align: 'left', minWidth: 150, sticky: true, sortable: true },
    { field: 'sanctionedLoadKw', headerName: 'SANCTIONED LOAD (KW)', align: 'center', width: 140, sortable: true, valueFormatter: (v) => v ? Number(v).toLocaleString('en-IN') : '-' },
    { field: 'stateCode', headerName: 'STATE', align: 'center', width: 80, sortable: true },
    { field: 'discom', headerName: 'DISCOM', align: 'left', width: 120, sortable: true },
    { field: 'consumerCategory', headerName: 'CATEGORY', align: 'left', width: 110, sortable: true },
    { field: 'voltageLevel', headerName: 'VOLTAGE', align: 'center', width: 100, sortable: true },
    {
      field: 'createdAt',
      headerName: 'CREATED AT',
      align: 'center',
      width: 160,
      sortable: true,
      valueFormatter: (v) => v ? new Date(v as string).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'
    },
    {
      field: 'createdBy',
      headerName: 'CREATED BY',
      align: 'center',
      width: 120,
      sortable: true,
      valueFormatter: (v) => v || '-'
    },
    {
      field: 'updatedAt',
      headerName: 'UPDATED AT',
      align: 'center',
      width: 160,
      sortable: true,
      valueFormatter: (v) => v ? new Date(v as string).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'
    },
    {
      field: 'updatedBy',
      headerName: 'UPDATED BY',
      align: 'center',
      width: 120,
      sortable: true,
      valueFormatter: (v) => v || '-'
    },
    {
      field: 'actions',
      headerName: 'ACTIONS',
      align: 'center',
      width: 220,
      stickyRight: true,
      renderCell: (row: SavingsCalculatorNewEntry) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalculateIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => navigate(`/savings-calculator-new/${row.id}/analysis`)}
            sx={{
              fontSize: '11px',
              py: 0.5,
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#7C3AED',
                bgcolor: 'rgba(139, 92, 246, 0.05)'
              }
            }}
          >
            View
          </Button>

          <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: 'text.secondary' }}>
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton size="small" onClick={() => navigate(`/savings-calculator-new/${row.id}/analysis`)} sx={{ color: '#8B5CF6' }}>
            <HistoryIcon fontSize="small" />
          </IconButton>

          <IconButton size="small" onClick={() => handleDeleteEntry(row.id)} sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
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

  const isStepValid = (stepIndex: number) => {
    if (stepIndex === 0) return Boolean(clientName && industryName && address);
    if (stepIndex === 1) return Boolean(stateCode && discom);
    if (stepIndex === 2) return Boolean(consumerCategory && voltageLevel);
    if (stepIndex === 3) return Boolean(sanctionedLoadKw && !isNaN(Number(sanctionedLoadKw)) && Number(sanctionedLoadKw) > 0);
    return true;
  };

  const renderStep = (stepIndex: number, stepMeta: { icon: React.ReactNode; title: string; question: string; summary: string; content: React.ReactNode }) => {
    const isCompleted = activeStep > stepIndex;
    const isActive = activeStep === stepIndex;

    if (isCompleted) {
      return (
        <Card
          key={stepIndex}
          elevation={0}
          sx={{
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            p: 2,
            bgcolor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stepMeta.title}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                {stepMeta.summary}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setActiveStep(stepIndex)}>
            <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Card>
      );
    }

    if (isActive) {
      return (
        <Card
          key={stepIndex}
          elevation={0}
          sx={{
            border: '2px solid #8B5CF6',
            borderRadius: '16px',
            p: 3,
            boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.08)',
            bgcolor: '#FFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ color: '#8B5CF6', display: 'flex', alignItems: 'center' }}>
              {stepMeta.icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.05rem' }}>
              {stepMeta.question}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            {stepMeta.content}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {stepIndex > 0 && (
              <Button
                onClick={() => setActiveStep(stepIndex - 1)}
                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
              >
                Back
              </Button>
            )}
            <Button
              variant="contained"
              disabled={!isStepValid(stepIndex)}
              onClick={() => {
                if (isStepValid(stepIndex)) {
                  if (stepIndex < 4) {
                    setActiveStep(stepIndex + 1);
                  } else {
                    setDialogOpen(false);
                    setTodDialogOpen(true);
                  }
                }
              }}
              endIcon={<ArrowForwardIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: 2.5,
                fontWeight: 600,
                bgcolor: '#8B5CF6',
                '&:hover': { bgcolor: '#7C3AED' }
              }}
            >
              Continue
            </Button>
          </Box>
        </Card>
      );
    }

    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Top Header & Search Bar */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
              Savings Calculator (New)
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Compare grid utility tariffs against energy market procurement clearing prices.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <OutlinedInput
            placeholder="Search entries..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            }
            sx={{
              borderRadius: 2,
              bgcolor: 'background.paper',
              minWidth: 250
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              textTransform: 'none',
              borderRadius: 2.5,
              fontWeight: 600,
              bgcolor: '#8B5CF6',
              '&:hover': {
                bgcolor: '#7C3AED'
              },
              px: 2.5,
              py: 1
            }}
          >
            Create New Entry
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Entries Table Container */}
      <TableContainer
        title="Savings Calculator Entries"
        columns={columns}
        data={filteredEntries}
        loading={loading}
        emptyStateMessage={
          <EmptyTableState
            title="No entries found"
            description="Create your first client configuration entry to simulate and calculate savings."
            onAddRecord={handleOpenCreate}
          />
        }
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
              {dialogMode === 'create' ? 'Create New Entry' : 'Edit Entry'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, bgcolor: '#F8FAFC' }}>
          {/* Progress Bar */}
          <Box sx={{ width: '100%', height: 6, bgcolor: '#E2E8F0', borderRadius: 3, mb: 1, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%',
              width: `${((activeStep + 1) / 5) * 100}%`,
              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </Box>

          {/* Step 0: Client & Facility Details */}
          {renderStep(0, {
            icon: <BusinessIcon />,
            title: 'Client Information',
            question: 'Who is the client for this simulation?',
            summary: `Client: ${clientPrefix ? `${clientPrefix} ` : ''}${clientName} (${industryName})`,
            content: (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <TextField
                  label="Client Name *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Select
                          value={clientPrefix}
                          onChange={(e) => setClientPrefix(e.target.value)}
                          variant="standard"
                          disableUnderline
                          displayEmpty
                          sx={{ '& .MuiSelect-select': { py: 0, pr: 1, color: 'text.secondary' } }}
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
                <TextField
                  label="Industry Name *"
                  value={industryName}
                  onChange={(e) => setIndustryName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Address *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  variant="outlined"
                  size="small"
                />
              </Box>
            )
          })}

          {/* Step 1: Location & DISCOM */}
          {renderStep(1, {
            icon: <LocationIcon />,
            title: 'Location & DISCOM',
            question: 'Where is your facility located and who is your DISCOM?',
            summary: `Location: ${stateCode} | DISCOM: ${discom}`,
            content: (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="State Code *"
                    value={stateCode}
                    onChange={(e) => {
                      setStateCode(e.target.value);
                      const stateDiscoms = STATE_DISCOM_MASTER[e.target.value]?.discoms || [];
                      if (stateDiscoms.length > 0) setDiscom(stateDiscoms[0].code);
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
                <Grid item xs={12} sm={6}>
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
              </Grid>
            )
          })}

          {/* Step 2: Consumer Category & Voltage Level */}
          {renderStep(2, {
            icon: <CategoryIcon />,
            title: 'Consumer Category & Voltage',
            question: 'What is your consumer category and voltage level?',
            summary: `Category: ${consumerCategory} | Voltage: ${voltageLevel}`,
            content: (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Consumer Category *"
                    value={consumerCategory}
                    onChange={(e) => setConsumerCategory(e.target.value)}
                    fullWidth
                    size="small"
                  >
                    {categoryOptions.map((c) => (
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
              </Grid>
            )
          })}

          {/* Step 3: Sanctioned Load */}
          {renderStep(3, {
            icon: <SpeedIcon />,
            title: 'Sanctioned Load',
            question: 'What is your sanctioned load capacity?',
            summary: `Sanctioned Load: ${sanctionedLoadKw} kW (${sanctionedLoadKva} kVA)`,
            content: (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
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
                </Grid>
                <Grid item xs={12} sm={6}>
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
                </Grid>
              </Grid>
            )
          })}

          {/* Step 4: Grid Charges & Discom Parameters */}
          {renderStep(4, {
            icon: <ElectricBoltIcon />,
            title: 'Grid Charges & Discom Parameters',
            question: 'What are your electricity duty and demand charge rates?',
            summary: `Electricity Duty: ${electricityDutyPercent}% | Demand Charge: ₹${demandChargeKwRate}/kW/month`,
            content: (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
              </Grid>
            )
          })}

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
          <Button onClick={handleCloseDialog} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Standalone Popup 1: TOD Monthly Consumption Dialog */}
      <Dialog
        open={todDialogOpen}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setTodDialogOpen(false); }}
        disableEscapeKeyDown
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 3, bgcolor: '#F8FAFC', maxWidth: '1200px', width: '95vw' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, pb: 0 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>Enter ToD Consumption</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Add monthly consumption data for each Time-of-Day period</Typography>
          </Box>
          <IconButton onClick={() => setTodDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Overlap Alert Banner */}
          {(() => {
            const slots = (activeMonthData.slots || []) as CustomTodSlot[];
            const overlapMap = getOverlappingSlotMap(slots);
            if (overlapMap.size > 0) {
              return (
                <Alert severity="error" sx={{ borderRadius: 2, '& .MuiAlert-message': { fontWeight: 600 } }}>
                  TOD Time Slots overlap! Please adjust start and end times so slots do not overlap.
                </Alert>
              );
            }
            return null;
          })()}

          {/* Monthly Accordions */}
          {Object.keys(todConsumptions).filter(m => !m.startsWith('_') && m.includes('-')).sort().map((ym, index) => {
            const monthData = todConsumptions[ym] || { startDate: `${ym}-01`, endDate: `${ym}-30`, peakDemandKw: 1000, slots: [] };
            const isExpanded = expandedAccordion === 'initial' ? index === 0 : expandedAccordion === ym;

            return (
              <Accordion
                key={ym}
                expanded={isExpanded}
                onChange={(e, expanded) => setExpandedAccordion(expanded ? ym : false)}
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {new Date(`${ym}-01`).toLocaleString('default', { month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMonth(ym, e);
                      }}
                    >
                      <DeleteIcon fontSize="small" color="action" />
                    </IconButton>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2.5, pt: 1, bgcolor: '#FFFFFF' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      Billing Period & Peak Demand for {ym}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setActiveMonth(ym);
                        handleAddTodSlot();
                      }}
                      sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' }, textTransform: 'none', borderRadius: 2 }}
                    >
                      + Add TOD Slot
                    </Button>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={8}>
                      <DateRangePicker
                        startDate={monthData.startDate || `${ym}-01`}
                        endDate={monthData.endDate || `${ym}-30`}
                        onChange={(start, end) => {
                          setActiveMonth(ym);
                          handleUpdateBilledDates(start, end);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Peak Demand (kW)"
                        type="number"
                        size="small"
                        value={monthData.peakDemandKw || ''}
                        onChange={(e) => {
                          setActiveMonth(ym);
                          handleUpdatePeakDemand(Number(e.target.value));
                        }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  {/* Slot Table */}
                  <Table size="small" sx={{ minWidth: 950 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700 }}>TOD Slot Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Start Time</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>End Time</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Consumption (kWh)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Consumption (kVAh)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Effective Price (₹/kWh)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const slots = (monthData.slots || []) as CustomTodSlot[];
                        const overlapMap = getOverlappingSlotMap(slots);
                        const currentPf = powerFactor && !isNaN(Number(powerFactor)) && Number(powerFactor) > 0 ? Number(powerFactor) : 0.99;

                        return slots.map((slot, idx) => {
                          const isOverlapping = overlapMap.has(idx);
                          const kwhVal = Number(slot.consumptionKwh) || 0;
                          const kvahVal = kwhVal > 0 ? Math.round(kwhVal / currentPf) : 0;

                          return (
                            <TableRow key={slot.id || idx} sx={{ bgcolor: isOverlapping ? '#FEF2F2' : 'inherit' }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    size="small"
                                    value={slot.name || ''}
                                    onChange={(e) => {
                                      setActiveMonth(ym);
                                      handleUpdateTodSlot(idx, 'name', e.target.value);
                                    }}
                                    placeholder={`Slot ${idx + 1}`}
                                  />
                                  {isOverlapping && (
                                    <Chip label="Overlap" size="small" color="error" sx={{ ml: 1, fontSize: 10, height: 20, fontWeight: 700 }} />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  size="small"
                                  type="time"
                                  error={isOverlapping}
                                  value={slot.startTime || '00:00'}
                                  onChange={(e) => {
                                    setActiveMonth(ym);
                                    handleUpdateTodSlot(idx, 'startTime', e.target.value);
                                  }}
                                  inputProps={{ step: 300 }}
                                  sx={{ width: 110 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  size="small"
                                  type="time"
                                  error={isOverlapping}
                                  value={slot.endTime || '24:00'}
                                  onChange={(e) => {
                                    setActiveMonth(ym);
                                    handleUpdateTodSlot(idx, 'endTime', e.target.value);
                                  }}
                                  inputProps={{ step: 300 }}
                                  sx={{ width: 110 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={slot.consumptionKwh}
                                  onChange={(e) => {
                                    setActiveMonth(ym);
                                    handleUpdateTodSlot(idx, 'consumptionKwh', e.target.value);
                                  }}
                                  sx={{ width: 110 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={kvahVal}
                                  onChange={(e) => {
                                    setActiveMonth(ym);
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
                                  onChange={(e) => {
                                    setActiveMonth(ym);
                                    handleUpdateTodSlot(idx, 'effectivePrice', e.target.value);
                                  }}
                                  sx={{ width: 130 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton color="error" size="small" onClick={() => {
                                  setActiveMonth(ym);
                                  handleRemoveTodSlot(idx);
                                }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            );
          })}

          {/* + Add New Month Accordion */}
          <Accordion
            elevation={0}
            expanded={expandedAccordion === 'new_month'}
            onChange={(e, isExpanded) => setExpandedAccordion(isExpanded ? 'new_month' : false)}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8FAFC', borderRadius: '12px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>+ Add New Month</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3, pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>Month</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  select
                  label="Year"
                  value={entryYear}
                  onChange={(e) => setEntryYear(Number(e.target.value))}
                  size="small"
                  sx={{ width: 120, bgcolor: '#FFF' }}
                >
                  <MenuItem value={2023}>2023</MenuItem>
                  <MenuItem value={2024}>2024</MenuItem>
                  <MenuItem value={2025}>2025</MenuItem>
                  <MenuItem value={2026}>2026</MenuItem>
                  <MenuItem value={2027}>2027</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Month"
                  value={entryMonth}
                  onChange={(e) => setEntryMonth(Number(e.target.value))}
                  size="small"
                  sx={{ width: 150, bgcolor: '#FFF' }}
                >
                  <MenuItem value={1}>January</MenuItem>
                  <MenuItem value={2}>February</MenuItem>
                  <MenuItem value={3}>March</MenuItem>
                  <MenuItem value={4}>April</MenuItem>
                  <MenuItem value={5}>May</MenuItem>
                  <MenuItem value={6}>June</MenuItem>
                  <MenuItem value={7}>July</MenuItem>
                  <MenuItem value={8}>August</MenuItem>
                  <MenuItem value={9}>September</MenuItem>
                  <MenuItem value={10}>October</MenuItem>
                  <MenuItem value={11}>November</MenuItem>
                  <MenuItem value={12}>December</MenuItem>
                </TextField>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                fullWidth
                onClick={() => {
                  const key = `${entryYear}-${String(entryMonth).padStart(2, '0')}`;
                  if (!todConsumptions[key]) {
                    const lastDay = new Date(entryYear, entryMonth, 0).getDate();
                    setTodConsumptions(prev => ({
                      ...prev,
                      [key]: {
                        startDate: `${key}-01`,
                        endDate: `${key}-${String(lastDay).padStart(2, '0')}`,
                        peakDemandKw: Number(sanctionedLoadKw) || 1000,
                        slots: [
                          { id: `tod-1`, name: 'Slot 1', startTime: '05:00', endTime: '08:00', consumptionKwh: 10000, effectivePrice: 8.50 },
                          { id: `tod-2`, name: 'Slot 2', startTime: '17:00', endTime: '23:00', consumptionKwh: 25000, effectivePrice: 9.20 }
                        ]
                      }
                    }));
                    setActiveMonth(key);
                    setExpandedAccordion(key);
                  } else {
                    setError('This month has already been added.');
                  }
                }}
                sx={{ mt: 3, height: 48, textTransform: 'none', borderRadius: 2, borderStyle: 'dashed', color: '#1E293B', borderColor: '#CBD5E1' }}
              >
                + Add Month
              </Button>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setTodDialogOpen(false);
              setDialogOpen(true);
              setActiveStep(4);
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              height: 48,
              fontWeight: 600,
              fontSize: '16px',
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              '&:hover': {
                borderColor: '#7C3AED',
                backgroundColor: 'rgba(139, 92, 246, 0.04)'
              }
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setTodDialogOpen(false);
              setProltDialogOpen(true);
            }}
            sx={{
              bgcolor: '#8B5CF6',
              '&:hover': { bgcolor: '#7C3AED' },
              borderRadius: 2,
              textTransform: 'none',
              height: 48,
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            Preview Inputs
          </Button>
        </DialogActions>
      </Dialog>

      {/* Standalone Popup 2: Margin Details Dialog */}
      <Dialog
        open={proltDialogOpen}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setProltDialogOpen(false); }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 2, bgcolor: '#FFF' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, pb: 0 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>Margin Details</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>What are the commercial margin rates for this client?</Typography>
          </Box>
          <IconButton onClick={() => setProltDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Trader Margin (₹/kWh)"
            type="number"
            inputProps={{ step: 0.01 }}
            value={traderMargin}
            onChange={(e) => setTraderMargin(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="PROLT Consultancy Fee (₹)"
            type="number"
            value={consultancyFee}
            onChange={(e) => setConsultancyFee(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Metering Charges (₹)"
            type="number"
            value={meteringCharges}
            onChange={(e) => setMeteringCharges(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Probus Platform Subscription Fee (₹)"
            type="number"
            value={probusPlatformFee}
            onChange={(e) => setProbusPlatformFee(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="PROLT Margin (% of total savings)"
            type="number"
            inputProps={{ step: 0.1 }}
            value={proltMargin}
            onChange={(e) => setProltMargin(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setProltDialogOpen(false);
              setTodDialogOpen(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              height: 48,
              fontWeight: 600,
              fontSize: '16px',
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              '&:hover': {
                borderColor: '#7C3AED',
                backgroundColor: 'rgba(139, 92, 246, 0.04)'
              }
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveEntry}
            sx={{
              bgcolor: '#8B5CF6',
              '&:hover': { bgcolor: '#7C3AED' },
              borderRadius: 2,
              textTransform: 'none',
              height: 48,
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            {dialogMode === 'create' ? 'Save Client Entry' : 'Update Client Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
