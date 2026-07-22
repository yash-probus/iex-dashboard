import { apiClient } from './client';

export interface SavingsCalculatorEntry {
  id: string;
  clientName: string;
  industryName: string;
  address: string;
  sanctionedLoadKw?: number;
  stateCode?: string;
  discom?: string;
  consumerCategory?: string;
  voltageLevel?: string;
  proltMargin?: number;
  traderMargin?: number;
  todConsumptions?: Record<string, Record<string, number | string>>;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsCalculatorEntryHistory extends SavingsCalculatorEntry {
  entryId: string;
  version: number;
  changedAt: string;
}

export interface CreateSavingsEntryDto {
  clientName: string;
  industryName: string;
  address: string;
  sanctionedLoadKw?: number;
  stateCode?: string;
  discom?: string;
  consumerCategory?: string;
  voltageLevel?: string;
  proltMargin?: number;
  traderMargin?: number;
  todConsumptions?: Record<string, Record<string, number | string>>;
}

export interface CalculationSlotDetail {
  date: string;
  slot: number;
  timeStr: string;
  todSlab: string;
  damLandingPrice: number;
  rtmLandingPrice: number;
  gdamLandingPrice: number;
  discomLandingPrice: number;
  comparedLowestPrice: number;
  selectedSource: string;
  maxEnergyPerSlot: number;
  optimizedCost: number;
  baselineCost: number;
  istsLoss?: number;
  stuLoss?: number;
  wheelingLoss?: number;
}

export interface CalculationResult {
  clientId: string;
  clientName: string;
  sanctionedLoad: number;
  maxEnergyPerSlot: number;
  totalEnergyKwh: number;
  totalMarketEnergyKwh: number;
  totalBaselineCost: number;
  totalOptimizedCost: number;
  totalSavings: number;
  todGroups: Record<string, CalculationSlotDetail[]>;
  sortedMonthlyList: CalculationSlotDetail[];
}

export interface MarketDecisionSlot {
  date: string;
  timeblock: number;
  hour: number;
  tod: string;
  damMcp: number | null;
  rtmMcp: number | null;
  gdamMcp: number | null;
  damLanding: number | null;
  rtmLanding: number | null;
  gdamLanding: number | null;
  bestMarketLanding: number;
  marketSource: string;
  discomLanding: number;
  shouldBuyFromMarket: boolean;
  savingsPerKwh: number;
  istsLoss: number;
  stuLoss: number;
  wheelingLoss: number;
  marketEnergy?: number;
  discomEnergy?: number;
}

export interface MarketDecisionTodSummary {
  slabName: string;
  totalEnergyKwh: number;
  marketEnergyKwh: number;
  marketCostBase?: number;
}

export interface OADetailedBreakdown {
  slabName: string;
  discomUnits: number;
  oaUnits: number;
  discomBill: number;
  proltDiscomBill: number;
  consumerBusUnits: number;
  oaBill: number;
}

export interface MarketDecisionResult {
  clientId: string;
  clientName: string;
  slotsData: MarketDecisionSlot[];
  totalEnergyKwh: number;
  totalMarketEnergyKwh: number;
  totalBaselineCost: number;
  totalLandedExchangeCost: number;
  totalSavings: number;
  demandCharge?: number;
  electricityDuty?: number;
  todSummaries?: MarketDecisionTodSummary[];
  oaDetailed?: {
    breakdown: OADetailedBreakdown[];
    dailyFixedOverhead: number;
    nldcSchedulingCost?: number;
    sldcSchedulingCost?: number;
    bidApplicationFees: number;
    totalDaysTraded: number;
  };
}

export const fetchSavingsEntries = async (): Promise<SavingsCalculatorEntry[]> => {
  const response = await apiClient.get<SavingsCalculatorEntry[]>('/savings-calculator');
  return response.data;
};

export const fetchSavingsEntryById = async (id: string): Promise<SavingsCalculatorEntry> => {
  const response = await apiClient.get<SavingsCalculatorEntry>(`/savings-calculator/${id}`);
  return response.data;
};

export const fetchEntryHistory = async (id: string): Promise<SavingsCalculatorEntryHistory[]> => {
  const response = await apiClient.get<SavingsCalculatorEntryHistory[]>(`/savings-calculator/${id}/history`);
  return response.data;
};

export const createSavingsEntry = async (data: CreateSavingsEntryDto): Promise<SavingsCalculatorEntry> => {
  const response = await apiClient.post<SavingsCalculatorEntry>('/savings-calculator', data);
  return response.data;
};

export const updateSavingsEntry = async (id: string, data: CreateSavingsEntryDto): Promise<SavingsCalculatorEntry> => {
  const response = await apiClient.put<SavingsCalculatorEntry>(`/savings-calculator/${id}`, data);
  return response.data;
};

export const deleteSavingsEntry = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/savings-calculator/${id}`);
  return response.data;
};

export const calculateSavings = async (id: string, month?: string, version?: number): Promise<CalculationResult> => {
  const url = `/savings-calculator/${id}/calculate`;
  const response = await apiClient.post<CalculationResult>(url, {}, { params: { month, version } });
  return response.data;
};

export interface ClientOverviewResult {
  clientName: string;
  industryName: string;
  months: {
    month: string;
    savings: number;
    grossSavings?: number;
    error?: string;
  }[];
  totalSavings: number;
  aggregatedCosts?: {
    cssCharge: number;
    rpoCharge: number;
    pocCharge: number;
    stuCharge: number;
    dcCharge: number;
    iexFee: number;
    traderMarginTotal: number;
    dailyFixedOverhead: number;
    bidApplicationFees: number;
    proltMarginCost: number;
  };
}

export const fetchClientOverview = async (id: string): Promise<ClientOverviewResult> => {
  const url = `/savings-calculator/${id}/overview`;
  const response = await apiClient.get<ClientOverviewResult>(url);
  return response.data;
};

export const calculateMarketDecision = async (id: string, month?: string, version?: number): Promise<MarketDecisionResult> => {
  const url = `/savings-calculator/${id}/calculate-market-decision`;
  const response = await apiClient.post<MarketDecisionResult>(url, {}, { params: { month, version } });
  return response.data;
};

export const exportSavingsExcel = async (id: string, targetMonth?: string, version?: number): Promise<void> => {
  const response = await apiClient.get('/savings-calculator/' + id + '/export-excel', {
    params: { month: targetMonth, version },
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'Savings_Analysis.xlsx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch && filenameMatch.length === 2)
        filename = filenameMatch[1];
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportDemandShiftExcel = async (id: string, targetMonth?: string, version?: number): Promise<void> => {
  const response = await apiClient.get('/savings-calculator/' + id + '/demand-shift-insights/export-excel', {
    params: { month: targetMonth, version },
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'Demand_Shift_Insights.xlsx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch && filenameMatch.length === 2)
        filename = filenameMatch[1];
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export interface DemandShiftInsightsResult {
  clientId: string;
  clientName: string;
  sanctionedLoadKw: number;
  maxEnergyPerSlot: number;
  originalTotalCost: number;
  newTotalCost: number;
  savingsAchieved: number;
  shiftedEnergy: number;
  todShiftSummary: {
    tod: string;
    originalEnergy: number;
    newEnergy: number;
    diff: number;
    originalMarketEnergy: number;
    newMarketEnergy: number;
  }[];
  slotsData: {
    date: string;
    timeblock: number;
    tod: string;
    originalEnergy: number;
    newEnergy: number;
    costPerKwh: number;
    marketSource: string;
    shouldBuyFromMarket: boolean;
    marketEnergy: number;
    discomEnergy: number;
  }[];
}

export const fetchDemandShiftInsights = async (id: string, targetMonth?: string, version?: number): Promise<DemandShiftInsightsResult> => {
  const response = await apiClient.post<DemandShiftInsightsResult>(`/savings-calculator/${id}/demand-shift-insights`, {}, {
    params: { month: targetMonth, version },
  });
  return response.data;
};
