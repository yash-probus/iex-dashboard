import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Bolt as BoltIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  UploadFile as UploadFileIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  WarningAmber as WarningIcon,
  AccountBalance as AccountBalanceIcon,
  Speed as SpeedIcon,
  DoneAll as DoneAllIcon,
  AccessTime as AccessTimeIcon,
  SettingsSuggest as SettingsSuggestIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  fetchDailyConsumers,
  saveDailyConsumer,
  uploadDailyTradeReportPdfs,
  fetchDailyAnalysis,
  DailyConsumer,
  DailyAnalysisResponse
} from '../api/traderPerformanceDaily.api';

// Master Data for Indian States & Discoms
export const STATE_DISCOM_MASTER: Record<string, { name: string; discoms: { code: string; name: string }[] }> = {
  UP: {
    name: 'Uttar Pradesh',
    discoms: [
      { code: 'PUVVNL', name: 'PUVVNL (Purvanchal Vidyut Vitran)' },
      { code: 'PVVNL', name: 'PVVNL (Paschimanchal Vidyut Vitran)' },
      { code: 'DVVNL', name: 'DVVNL (Dakshinanchal Vidyut Vitran)' },
      { code: 'MVVNL', name: 'MVVNL (Madhyanchal Vidyut Vitran)' },
      { code: 'NPCL', name: 'NPCL (Noida Power Company Limited)' },
      { code: 'KESCO', name: 'KESCO (Kanpur Electricity Supply Company)' }
    ]
  },
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
  JH: {
    name: 'Jharkhand',
    discoms: [
      { code: 'JBVNL', name: 'JBVNL (Jharkhand Bijli Vitran Nigam)' }
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
  AS: {
    name: 'Assam',
    discoms: [
      { code: 'APDCL', name: 'APDCL (Assam Power Distribution Company)' }
    ]
  },
  GA: {
    name: 'Goa',
    discoms: [
      { code: 'GED', name: 'GED (Goa Electricity Department)' }
    ]
  },
  BR: {
    name: 'Bihar',
    discoms: [
      { code: 'NBPDCL', name: 'NBPDCL (North Bihar Power Distribution)' },
      { code: 'SBPDCL', name: 'SBPDCL (South Bihar Power Distribution)' }
    ]
  },
  KL: {
    name: 'Kerala',
    discoms: [
      { code: 'KSEBL', name: 'KSEBL (Kerala State Electricity Board)' }
    ]
  }
};

const CATEGORY_OPTIONS = [
  'HV-2 | Urban Schedule (Large & Heavy Power)',
  'HV-1 | Commercial',
  'Industrial',
  'Commercial',
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

interface CustomTodSlotItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  effectivePrice: number | string;
}

export default function TraderPerformanceDailyPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // State variables
  const [consumers, setConsumers] = useState<DailyConsumer[]>([]);
  const [selectedConsumerId, setSelectedConsumerId] = useState<string>('poorvanchal-default');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [selectedTargetDate, setSelectedTargetDate] = useState<string>(getTodayDate());

  const [analysisData, setAnalysisData] = useState<DailyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  // PDF Upload State
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Configure TOD & Consumer Edit Dialog State
  const [todDialogOpen, setTodDialogOpen] = useState<boolean>(false);
  const [currentTodSlots, setCurrentTodSlots] = useState<CustomTodSlotItem[]>([]);
  const [editConsumerForm, setEditConsumerForm] = useState({
    name: '',
    stateCode: 'UP',
    discom: 'PUVVNL',
    consumerCategory: 'HV-2 | Urban Schedule (Large & Heavy Power)',
    voltageLevel: '11 kV',
    meterNo: '',
    sanctionedLoadKw: 1000,
    powerFactor: 0.99,
    discomBaseTariff: 7.65
  });

  // New Consumer Modal State
  const [newConsumerDialogOpen, setNewConsumerDialogOpen] = useState<boolean>(false);
  const [newConsumerForm, setNewConsumerForm] = useState({
    name: '',
    stateCode: 'UP',
    discom: 'PUVVNL',
    consumerCategory: 'HV-2 | Urban Schedule (Large & Heavy Power)',
    voltageLevel: '11 kV',
    meterNo: '',
    sanctionedLoadKw: 1000,
    powerFactor: 0.99,
    discomBaseTariff: 7.65,
    customTodSlots: [
      { id: 'tod-1', name: 'Slot 1 (Off-Peak)', startTime: '22:00', endTime: '06:00', effectivePrice: 6.50 },
      { id: 'tod-2', name: 'Slot 2 (Normal)', startTime: '06:00', endTime: '17:00', effectivePrice: 7.65 },
      { id: 'tod-3', name: 'Slot 3 (Peak)', startTime: '17:00', endTime: '22:00', effectivePrice: 8.80 }
    ] as CustomTodSlotItem[]
  });

  // Discom options helper based on selected state
  const getDiscomOptionsForState = (stCode: string, currentVal?: string) => {
    const list: { code: string; name: string }[] = [];
    if (STATE_DISCOM_MASTER[stCode]) {
      list.push(...STATE_DISCOM_MASTER[stCode].discoms);
    }
    if (currentVal && !list.some(x => x.code === currentVal)) {
      list.push({ code: currentVal, name: currentVal });
    }
    return list;
  };

  // State options list
  const stateOptions = Object.entries(STATE_DISCOM_MASTER).map(([code, val]) => ({
    code,
    name: `${code} - ${val.name}`
  }));

  // Handle State Change in New Consumer Form
  const handleNewConsumerStateChange = (newSt: string) => {
    const availableDiscoms = getDiscomOptionsForState(newSt);
    const newDiscom = availableDiscoms.length > 0 ? availableDiscoms[0].code : '';
    setNewConsumerForm({
      ...newConsumerForm,
      stateCode: newSt,
      discom: newDiscom
    });
  };

  // Handle State Change in Edit Consumer Form
  const handleEditConsumerStateChange = (newSt: string) => {
    const availableDiscoms = getDiscomOptionsForState(newSt);
    const newDiscom = availableDiscoms.length > 0 ? availableDiscoms[0].code : '';
    setEditConsumerForm({
      ...editConsumerForm,
      stateCode: newSt,
      discom: newDiscom
    });
  };

  // Load consumers list
  const loadConsumers = async () => {
    try {
      const list = await fetchDailyConsumers();
      setConsumers(list);
      if (list.length > 0 && !selectedConsumerId) {
        setSelectedConsumerId(list[0].id);
      }
    } catch (err) {
      console.warn('Could not load consumers:', err);
    }
  };

  // Fetch calculation analysis
  const loadAnalysis = async (tradeReports?: any) => {
    setLoading(true);
    try {
      const data = await fetchDailyAnalysis({
        consumerId: selectedConsumerId,
        monthStr: selectedMonth,
        targetDate: selectedTargetDate,
        tradeReports
      });
      setAnalysisData(data);
      if (data && data.targetDate) {
        setSelectedTargetDate(data.targetDate);
      }
      if (data?.consumer) {
        if (data.consumer.customTodSlots) {
          setCurrentTodSlots(data.consumer.customTodSlots as any);
        }
        setEditConsumerForm({
          name: data.consumer.name || '',
          stateCode: data.consumer.stateCode || 'UP',
          discom: data.consumer.discom || 'PUVVNL',
          consumerCategory: data.consumer.consumerCategory || 'HV-2 | Urban Schedule (Large & Heavy Power)',
          voltageLevel: data.consumer.voltageLevel || '11 kV',
          meterNo: data.consumer.meterNo || '',
          sanctionedLoadKw: data.consumer.sanctionedLoadKw || 1000,
          powerFactor: data.consumer.powerFactor || 0.99,
          discomBaseTariff: data.consumer.discomBaseTariff || 7.65
        });
      }
    } catch (err: any) {
      console.error('Failed to load daily analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsumers();
  }, []);

  useEffect(() => {
    loadAnalysis();
  }, [selectedConsumerId, selectedMonth, selectedTargetDate]);

  // Handle Trade PDF Upload
  const handlePdfUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadDailyTradeReportPdfs(selectedFiles);
      setUploadResult(result);
      await loadAnalysis(result);
      setSelectedFiles([]);
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadResult(null);
      }, 1800);
    } catch (err: any) {
      console.error('PDF Upload Error:', err);
      setUploadError(err.response?.data?.message || err.message || 'Failed to parse trade PDFs');
    } finally {
      setUploading(false);
    }
  };

  // TOD slot handlers for New Consumer Modal
  const handleAddNewConsumerTodSlot = () => {
    const slots = newConsumerForm.customTodSlots || [];
    const newIdx = slots.length + 1;
    let defaultStart = '08:00';
    let defaultEnd = '12:00';
    if (slots.length > 0) {
      const last = slots[slots.length - 1];
      if (last.endTime) {
        defaultStart = last.endTime;
        const [h, m] = defaultStart.split(':').map(Number);
        const endH = (h + 4) % 24;
        defaultEnd = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      }
    }
    const newSlot: CustomTodSlotItem = {
      id: `tod-${Date.now()}-${newIdx}`,
      name: `Slot ${newIdx}`,
      startTime: defaultStart,
      endTime: defaultEnd,
      effectivePrice: 7.65
    };
    setNewConsumerForm({
      ...newConsumerForm,
      customTodSlots: [...slots, newSlot]
    });
  };

  const handleRemoveNewConsumerTodSlot = (idx: number) => {
    const slots = [...newConsumerForm.customTodSlots];
    slots.splice(idx, 1);
    setNewConsumerForm({ ...newConsumerForm, customTodSlots: slots });
  };

  const handleUpdateNewConsumerTodSlot = (idx: number, field: keyof CustomTodSlotItem, val: any) => {
    const slots = [...newConsumerForm.customTodSlots];
    if (slots[idx]) {
      slots[idx] = { ...slots[idx], [field]: val };
      setNewConsumerForm({ ...newConsumerForm, customTodSlots: slots });
    }
  };

  // TOD slot handlers for Active Consumer Edit
  const handleAddActiveConsumerTodSlot = () => {
    const slots = currentTodSlots || [];
    const newIdx = slots.length + 1;
    let defaultStart = '08:00';
    let defaultEnd = '12:00';
    if (slots.length > 0) {
      const last = slots[slots.length - 1];
      if (last.endTime) {
        defaultStart = last.endTime;
        const [h, m] = defaultStart.split(':').map(Number);
        const endH = (h + 4) % 24;
        defaultEnd = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      }
    }
    const newSlot: CustomTodSlotItem = {
      id: `tod-${Date.now()}-${newIdx}`,
      name: `Slot ${newIdx}`,
      startTime: defaultStart,
      endTime: defaultEnd,
      effectivePrice: 7.65
    };
    setCurrentTodSlots([...slots, newSlot]);
  };

  const handleRemoveActiveConsumerTodSlot = (idx: number) => {
    const slots = [...currentTodSlots];
    slots.splice(idx, 1);
    setCurrentTodSlots(slots);
  };

  const handleUpdateActiveConsumerTodSlot = (idx: number, field: keyof CustomTodSlotItem, val: any) => {
    const slots = [...currentTodSlots];
    if (slots[idx]) {
      slots[idx] = { ...slots[idx], [field]: val };
      setCurrentTodSlots(slots);
    }
  };

  // Save active consumer details & TOD slots
  const handleSaveActiveConsumerTodSlots = async () => {
    try {
      const activeConsumer = consumers.find(c => c.id === selectedConsumerId);
      if (activeConsumer) {
        await saveDailyConsumer({
          ...activeConsumer,
          name: editConsumerForm.name || activeConsumer.name,
          stateCode: editConsumerForm.stateCode || activeConsumer.stateCode,
          discom: editConsumerForm.discom || activeConsumer.discom,
          consumerCategory: editConsumerForm.consumerCategory || activeConsumer.consumerCategory,
          voltageLevel: editConsumerForm.voltageLevel || activeConsumer.voltageLevel,
          meterNo: editConsumerForm.meterNo || activeConsumer.meterNo,
          sanctionedLoadKw: Number(editConsumerForm.sanctionedLoadKw) || activeConsumer.sanctionedLoadKw,
          powerFactor: Number(editConsumerForm.powerFactor) || activeConsumer.powerFactor,
          discomBaseTariff: Number(editConsumerForm.discomBaseTariff) || activeConsumer.discomBaseTariff,
          customTodSlots: currentTodSlots as any
        });
        setTodDialogOpen(false);
        await loadConsumers();
        await loadAnalysis();
      }
    } catch (err) {
      console.error('Failed to update TOD slots and consumer details:', err);
    }
  };

  // Handle saving new onboarded consumer with custom TOD slots
  const handleSaveNewConsumer = async () => {
    if (!newConsumerForm.name.trim()) return;
    try {
      const saved = await saveDailyConsumer({
        name: newConsumerForm.name,
        discom: newConsumerForm.discom,
        stateCode: newConsumerForm.stateCode,
        consumerCategory: newConsumerForm.consumerCategory,
        voltageLevel: newConsumerForm.voltageLevel,
        meterNo: newConsumerForm.meterNo,
        sanctionedLoadKw: Number(newConsumerForm.sanctionedLoadKw) || 1000,
        powerFactor: Number(newConsumerForm.powerFactor) || 0.99,
        discomBaseTariff: Number(newConsumerForm.discomBaseTariff) || 7.65,
        customTodSlots: newConsumerForm.customTodSlots as any
      });
      setNewConsumerDialogOpen(false);
      await loadConsumers();
      setSelectedConsumerId(saved.id);
    } catch (err) {
      console.error('Failed to save consumer:', err);
    }
  };

  const summary = analysisData?.summary;
  const consumer = analysisData?.consumer;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 5 }}>
      {/* Top Banner / Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h1" sx={{ fontSize: '1.45rem', fontWeight: 700, color: 'text.primary' }}>
                Trader Performance Daily
              </Typography>
              <Chip
                label="Custom TOD Enabled"
                size="small"
                sx={{
                  bgcolor: alpha('#10B981', 0.1),
                  color: '#059669',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
              {consumer && (
                <Chip
                  label={`Consumer: ${consumer.name}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'divider', fontWeight: 500, fontSize: '0.75rem' }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Compare actual savings from uploaded trade reports against potential savings with Probus Savings Calc using full Custom TOD slots.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<SettingsSuggestIcon />}
            onClick={() => {
              if (consumer?.customTodSlots) {
                setCurrentTodSlots(consumer.customTodSlots as any);
              }
              setTodDialogOpen(true);
            }}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#0284C7',
              color: '#0284C7',
              fontWeight: 600,
              bgcolor: alpha('#0284C7', 0.04),
              '&:hover': { borderColor: '#0369A1', bgcolor: alpha('#0284C7', 0.1) }
            }}
          >
            Edit Custom TODs
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              fontWeight: 600,
              bgcolor: alpha('#8B5CF6', 0.04),
              '&:hover': { borderColor: '#7C3AED', bgcolor: alpha('#8B5CF6', 0.1) }
            }}
          >
            Upload Trade PDFs
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewConsumerDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#10B981',
              color: 'white',
              fontWeight: 600,
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            Add Consumer
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadAnalysis()}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.primary'
            }}
          >
            Sync
          </Button>
        </Box>
      </Box>

      {/* Filter / Selector Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
            <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Parameters:
            </Typography>
          </Box>

          <TextField
            select
            label="Consumer / Entity"
            size="small"
            value={selectedConsumerId}
            onChange={(e) => setSelectedConsumerId(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            {consumers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({c.discom}, {c.stateCode})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="month"
            label="Billing Month"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <TextField
            type="date"
            label="Target Date Breakdown"
            size="small"
            value={selectedTargetDate}
            onChange={(e) => setSelectedTargetDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {consumer?.customTodSlots && consumer.customTodSlots.length > 0 && (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
              label={`${consumer.customTodSlots.length} Custom TOD Slot(s)`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
          {summary && summary.uploadedReportsCount > 0 && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              label={`${summary.uploadedReportsCount} Trade PDF(s)`}
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Paper>

      {/* HERO COMPARISON CALLOUT BANNER */}
      {summary && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Box sx={{ p: 2, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SpeedIcon sx={{ color: '#F59E0B' }} />
                <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.1em' }}>
                  MONTH-TILL-DATE SAVINGS COMPARISON ({selectedMonth})
                </Typography>
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.4, mb: 2 }}>
                In this month till now, you would have saved{' '}
                <Box component="span" sx={{ color: '#10B981', textDecoration: 'underline' }}>
                  ₹ {summary.mtdProbusSavings.toLocaleString('en-IN')}
                </Box>{' '}
                using our Savings Calculator (Custom TOD Optimized).
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      POTENTIAL WITH SAVINGS CALC
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#10B981', fontWeight: 700, mt: 0.5 }}>
                      ₹ {summary.mtdProbusSavings.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      Effective: ₹ {summary.avgProbusEffectiveRate.toFixed(2)} / kWh
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      ACTUAL SAVINGS (UPLOADED PDFs)
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#38BDF8', fontWeight: 700, mt: 0.5 }}>
                      ₹ {summary.mtdActualTraderSavings.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      Effective: ₹ {summary.avgActualTraderRate.toFixed(2)} / kWh
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(244,63,94,0.1)', borderRadius: 2, border: '1px solid rgba(244,63,94,0.2)' }}>
                    <Typography variant="caption" sx={{ color: '#FDA4AF', fontWeight: 600 }}>
                      EXTRA SAVINGS MISSED / OPPORTUNITY
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#FB7185', fontWeight: 700, mt: 0.5 }}>
                      ₹ {summary.mtdOpportunityLoss.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FECDD3' }}>
                      Additional profit left on table
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Paper>
      )}

      {/* KPI Summary Cards */}
      {summary && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#2E51FF', 0.1), color: '#2E51FF' }}>
                  <BoltIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    MTD Total Consumption
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    {(summary.mtdConsumptionKwh / 1000).toFixed(1)} MWh
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {summary.mtdConsumptionKwh.toLocaleString('en-IN')} kWh metered
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#10B981', 0.1), color: '#10B981' }}>
                  <CurrencyRupeeIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Baseline Discom Cost (Custom TOD)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    ₹ {Math.round(summary.mtdBaselineDiscomCost / 1000).toLocaleString('en-IN')}k
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Avg TOD Tariff: ₹{summary.avgBaselineTariff.toFixed(2)}/kWh
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}>
                  <TrendingUpIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Trader Traded Volume
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    {(summary.mtdTradedVolumeKwh / 1000).toFixed(1)} MWh
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    From uploaded trade PDFs
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B' }}>
                  <AssessmentIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Rate Arbitrage (Probus vs Trader)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                    ₹ {(summary.avgActualTraderRate - summary.avgProbusEffectiveRate).toFixed(2)} / kWh
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cheaper landed cost with Probus
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs & Detailed Breakdown */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Month-to-Date Daily Breakdown" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label={`15-Minute Intervals with Custom TOD Slots (${selectedTargetDate})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Calculating Custom TOD-wise clearing prices and performance metrics...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 0 }}>
            {/* TAB 0: DAY BY DAY MTD BREAKDOWN */}
            {activeTab === 0 && (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Consumption (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Discom Cost (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#10B981' }}>Probus Savings (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#0284C7' }}>Actual Trader Savings (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#E11D48' }}>Opportunity Missed (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Traded Volume (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Probus Landed Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Trader Landed Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysisData?.dailyBreakdown.map((row) => (
                      <TableRow
                        key={row.date}
                        hover
                        selected={row.date === selectedTargetDate}
                        onClick={() => setSelectedTargetDate(row.date)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.date} {row.date === selectedTargetDate && <Chip label="Selected" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} />}
                        </TableCell>
                        <TableCell align="right">{row.consumptionKwh.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹ {row.baselineDiscomCost.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ₹ {row.probusSavings.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#0284C7', fontWeight: 600 }}>
                          ₹ {row.actualTraderSavings.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#E11D48', fontWeight: 600 }}>
                          ₹ {row.opportunityLoss.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">{row.tradedVolumeKwh.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹ {row.avgProbusPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">₹ {row.avgTraderPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 1: 15-MINUTE 96-INTERVAL BREAKDOWN FOR TARGET DATE */}
            {activeTab === 1 && (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Block #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Time Slot</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Custom TOD Window</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Load (kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Discom TOD (₹/kWh)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>DAM / RTM / GDAM MCP</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Probus Optimal Market</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#10B981' }}>Probus Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Trader Traded (MW)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Trader Landed Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#10B981' }}>Probus Savings (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#E11D48' }}>Extra Savings Possible (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysisData?.intervalBreakdown.map((slot: any) => (
                      <TableRow key={slot.intervalNumber} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{slot.intervalNumber}</TableCell>
                        <TableCell>{slot.timeBlock}</TableCell>
                        <TableCell>
                          <Chip
                            label={slot.todSlotName || 'Normal'}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              borderColor: slot.todSlotName?.includes('Peak') || slot.todSlotName?.includes('Slot 3') ? '#F59E0B' : 'divider',
                              color: slot.todSlotName?.includes('Peak') || slot.todSlotName?.includes('Slot 3') ? '#D97706' : 'text.secondary'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">{slot.consumptionKwh.toFixed(1)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹ {slot.discomRate.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹{slot.damMcp.toFixed(2)} / ₹{slot.rtmMcp.toFixed(2)} / ₹{slot.gdamMcp.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={slot.probusSource}
                            size="small"
                            color={slot.probusSource === 'DISCOM' ? 'default' : 'success'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ₹ {slot.probusRate.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {slot.traderTradedMw > 0 ? `${slot.traderTradedMw.toFixed(2)} MW` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {slot.traderLandedRate ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: slot.traderLandedRate > slot.discomRate ? '#E11D48' : 'text.primary' }}>
                                ₹ {slot.traderLandedRate.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                                MCP: ₹{slot.traderClearedPrice?.toFixed(2)}
                              </Typography>
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ₹ {slot.probusSavingsVsDiscom}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#E11D48', fontWeight: 600 }}>
                          ₹ {slot.extraSavingsPossible}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* PDF UPLOAD DIALOG */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Daily Trade Report PDFs</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
            Upload IEX Trade Reports (DAM/RTM/GDAM). The system parses trade intervals, cleared volumes, and prices in memory without saving raw PDF files.
          </Alert>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            <input
              type="file"
              multiple
              accept="application/pdf"
              style={{ display: 'none' }}
              id="trade-pdf-upload-input"
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedFiles(Array.from(e.target.files));
                }
              }}
            />
            <label htmlFor="trade-pdf-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
              <UploadFileIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Click to browse or drag & drop trade report PDFs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports multiple DAM / GDAM / RTM trade report files
              </Typography>
            </label>
          </Box>

          {selectedFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Selected Files ({selectedFiles.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 120, overflowY: 'auto' }}>
                {selectedFiles.map((file, idx) => (
                  <Chip key={idx} label={file.name} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {uploading && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
                Parsing trade intervals, extracting cleared volumes & settlement charges...
              </Typography>
            </Box>
          )}

          {uploadResult && (
            <Alert severity="success" icon={<DoneAllIcon fontSize="inherit" />}>
              Successfully parsed and extracted trade data from {Object.keys(uploadResult.data || {}).length} file(s)!
            </Alert>
          )}

          {uploadError && <Alert severity="error">{uploadError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePdfUpload}
            disabled={selectedFiles.length === 0 || uploading}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            {uploading ? 'Processing...' : 'Parse & Extract Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT ACTIVE CONSUMER & CUSTOM TOD SLOTS DIALOG */}
      <Dialog open={todDialogOpen} onClose={() => setTodDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Configure Consumer & TOD Slots ({consumer?.name})</span>
          <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddActiveConsumerTodSlot}>
            Add TOD Slot
          </Button>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
            Configure State, Discom, and Custom TOD slot intervals (matching the client's electricity tariff schedule) for month-to-date daily savings calculations.
          </Alert>

          <TextField
            label="Consumer / Entity Name"
            size="small"
            required
            fullWidth
            value={editConsumerForm.name}
            onChange={(e) => setEditConsumerForm({ ...editConsumerForm, name: e.target.value })}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="State"
                size="small"
                fullWidth
                value={editConsumerForm.stateCode}
                onChange={(e) => handleEditConsumerStateChange(e.target.value)}
              >
                {stateOptions.map((st) => (
                  <MenuItem key={st.code} value={st.code}>
                    {st.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Discom"
                size="small"
                fullWidth
                value={editConsumerForm.discom}
                onChange={(e) => setEditConsumerForm({ ...editConsumerForm, discom: e.target.value })}
              >
                {getDiscomOptionsForState(editConsumerForm.stateCode, editConsumerForm.discom).map((d) => (
                  <MenuItem key={d.code} value={d.code}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Consumer Category"
                size="small"
                fullWidth
                value={editConsumerForm.consumerCategory}
                onChange={(e) => setEditConsumerForm({ ...editConsumerForm, consumerCategory: e.target.value })}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Voltage Level"
                size="small"
                fullWidth
                value={editConsumerForm.voltageLevel}
                onChange={(e) => setEditConsumerForm({ ...editConsumerForm, voltageLevel: e.target.value })}
              >
                {VOLTAGE_OPTIONS.map((vol) => (
                  <MenuItem key={vol} value={vol}>
                    {vol}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Meter Number"
                size="small"
                fullWidth
                value={editConsumerForm.meterNo}
                onChange={(e) => setEditConsumerForm({ ...editConsumerForm, meterNo: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Sanctioned Load (kW)"
                type="number"
                size="small"
                fullWidth
                value={editConsumerForm.sanctionedLoadKw}
                onChange={(e) => setEditConsumerForm({ ...editConsumerForm, sanctionedLoadKw: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Base Tariff (₹/kWh)"
                type="number"
                size="small"
                fullWidth
                value={editConsumerForm.discomBaseTariff}
                onChange={(e) => setEditConsumerForm({ ...editConsumerForm, discomBaseTariff: Number(e.target.value) })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Custom TOD Slots Table" size="small" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddActiveConsumerTodSlot}>
                Add TOD Slot
              </Button>
            </Box>
          </Divider>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Slot Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Effective Price (₹/kWh)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTodSlots.map((slot, idx) => (
                  <TableRow key={slot.id || idx}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={slot.name}
                        onChange={(e) => handleUpdateActiveConsumerTodSlot(idx, 'name', e.target.value)}
                        placeholder={`Slot ${idx + 1}`}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleUpdateActiveConsumerTodSlot(idx, 'startTime', e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleUpdateActiveConsumerTodSlot(idx, 'endTime', e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={slot.effectivePrice}
                        onChange={(e) => handleUpdateActiveConsumerTodSlot(idx, 'effectivePrice', e.target.value)}
                        sx={{ width: 130 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveActiveConsumerTodSlot(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setTodDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveActiveConsumerTodSlots} sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW CONSUMER ONBOARDING DIALOG WITH FULL CUSTOM TOD SLOTS TABLE */}
      <Dialog open={newConsumerDialogOpen} onClose={() => setNewConsumerDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Onboard New Consumer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Configure a new customer entity with State, Discom, tariff parameters & Custom TOD slot intervals.
          </Typography>

          <TextField
            label="Consumer / Client Name"
            size="small"
            required
            fullWidth
            value={newConsumerForm.name}
            onChange={(e) => setNewConsumerForm({ ...newConsumerForm, name: e.target.value })}
            placeholder="e.g. Poorvanchal Consumer"
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="State"
                size="small"
                fullWidth
                value={newConsumerForm.stateCode}
                onChange={(e) => handleNewConsumerStateChange(e.target.value)}
              >
                {stateOptions.map((st) => (
                  <MenuItem key={st.code} value={st.code}>
                    {st.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Discom"
                size="small"
                fullWidth
                value={newConsumerForm.discom}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, discom: e.target.value })}
              >
                {getDiscomOptionsForState(newConsumerForm.stateCode, newConsumerForm.discom).map((d) => (
                  <MenuItem key={d.code} value={d.code}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Consumer Category"
                size="small"
                fullWidth
                value={newConsumerForm.consumerCategory}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, consumerCategory: e.target.value })}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Voltage Level"
                size="small"
                fullWidth
                value={newConsumerForm.voltageLevel}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, voltageLevel: e.target.value })}
              >
                {VOLTAGE_OPTIONS.map((vol) => (
                  <MenuItem key={vol} value={vol}>
                    {vol}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Meter Number"
                size="small"
                fullWidth
                value={newConsumerForm.meterNo}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, meterNo: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Sanctioned Load (kW)"
                type="number"
                size="small"
                fullWidth
                value={newConsumerForm.sanctionedLoadKw}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, sanctionedLoadKw: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Base Tariff (₹/kWh)"
                type="number"
                size="small"
                fullWidth
                value={newConsumerForm.discomBaseTariff}
                onChange={(e) => setNewConsumerForm({ ...newConsumerForm, discomBaseTariff: Number(e.target.value) })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Custom TOD Slots Table" size="small" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddNewConsumerTodSlot}>
                Add TOD Slot
              </Button>
            </Box>
          </Divider>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Slot Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Effective Price (₹/kWh)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newConsumerForm.customTodSlots.map((slot, idx) => (
                  <TableRow key={slot.id || idx}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={slot.name}
                        onChange={(e) => handleUpdateNewConsumerTodSlot(idx, 'name', e.target.value)}
                        placeholder={`Slot ${idx + 1}`}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleUpdateNewConsumerTodSlot(idx, 'startTime', e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleUpdateNewConsumerTodSlot(idx, 'endTime', e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={slot.effectivePrice}
                        onChange={(e) => handleUpdateNewConsumerTodSlot(idx, 'effectivePrice', e.target.value)}
                        sx={{ width: 130 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveNewConsumerTodSlot(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setNewConsumerDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveNewConsumer}
            disabled={!newConsumerForm.name.trim()}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            Save Consumer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
