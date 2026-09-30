import { apiClient } from './client';

export interface DailyConsumer {
  id: string;
  name: string;
  discom: string;
  stateCode: string;
  consumerCategory: string;
  voltageLevel: string;
  sanctionedLoadKw: number;
  powerFactor: number;
  discomBaseTariff?: number;
  proltMargin?: number;
  traderMargin?: number;
  customTodSlots?: { id: string; name: string; startTime: string; endTime: string; effectivePrice?: number }[];
}

export interface DailySummaryMetrics {
  mtdConsumptionKwh: number;
  mtdBaselineDiscomCost: number;
  mtdProbusSavings: number;
  mtdActualTraderSavings: number;
  mtdOpportunityLoss: number;
  mtdTradedVolumeKwh: number;
  avgBaselineTariff: number;
  avgProbusEffectiveRate: number;
  avgActualTraderRate: number;
  uploadedReportsCount: number;
}

export interface DayBreakdownRow {
  date: string;
  consumptionKwh: number;
  baselineDiscomCost: number;
  probusCost: number;
  probusSavings: number;
  actualTraderCost: number;
  actualTraderSavings: number;
  opportunityLoss: number;
  tradedVolumeKwh: number;
  avgProbusPrice: number;
  avgTraderPrice: number;
}

export interface IntervalBreakdownRow {
  intervalNumber: number;
  timeBlock: string;
  consumptionKwh: number;
  discomRate: number;
  damMcp: number;
  rtmMcp: number;
  gdamMcp: number;
  probusSource: string;
  probusRate: number;
  probusCost: number;
  traderTradedMw: number;
  traderClearedPrice: number | null;
  traderLandedRate?: number | null;
  traderStatus: string;
  traderCost: number;
  probusSavingsVsDiscom: number;
  traderSavingsVsDiscom: number;
  extraSavingsPossible: number;
}

export interface DailyAnalysisResponse {
  consumer: DailyConsumer;
  monthStr: string;
  targetDate: string;
  totalDaysAnalyzed: number;
  summary: DailySummaryMetrics;
  dailyBreakdown: DayBreakdownRow[];
  intervalBreakdown: IntervalBreakdownRow[];
}

export const fetchDailyConsumers = async (): Promise<DailyConsumer[]> => {
  const res = await apiClient.get('/trader-performance-daily/consumers');
  return res.data?.data || [];
};

export const saveDailyConsumer = async (consumer: Partial<DailyConsumer>): Promise<DailyConsumer> => {
  const res = await apiClient.post('/trader-performance-daily/consumers', consumer);
  return res.data?.data;
};

export const uploadDailyTradeReportPdfs = async (files: File[]): Promise<any> => {
  const formData = new FormData();
  files.forEach(f => {
    formData.append('files', f);
  });
  const res = await apiClient.post('/trader-performance-daily/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data?.data;
};

export const fetchDailyAnalysis = async (params: {
  consumerId?: string;
  monthStr?: string;
  targetDate?: string;
  tradeReports?: any;
}): Promise<DailyAnalysisResponse> => {
  const queryParams = new URLSearchParams();
  if (params.consumerId) queryParams.set('consumerId', params.consumerId);
  if (params.monthStr) queryParams.set('monthStr', params.monthStr);
  if (params.targetDate) queryParams.set('targetDate', params.targetDate);

  if (params.tradeReports) {
    const res = await apiClient.post(`/trader-performance-daily/analysis?${queryParams.toString()}`, {
      tradeReports: params.tradeReports
    });
    return res.data?.data;
  } else {
    const res = await apiClient.get(`/trader-performance-daily/analysis?${queryParams.toString()}`);
    return res.data?.data;
  }
};
