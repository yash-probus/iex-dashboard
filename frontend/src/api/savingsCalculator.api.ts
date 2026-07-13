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
  todConsumptions?: Record<string, Record<string, number | string>>;
  createdAt: string;
  updatedAt: string;
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
}

export interface CalculationResult {
  clientId: string;
  clientName: string;
  sanctionedLoad: number;
  maxEnergyPerSlot: number;
  totalEnergyKwh: number;
  totalBaselineCost: number;
  totalOptimizedCost: number;
  totalSavings: number;
  todGroups: Record<string, CalculationSlotDetail[]>;
  sortedMonthlyList: CalculationSlotDetail[];
}

export const fetchSavingsEntries = async (): Promise<SavingsCalculatorEntry[]> => {
  const response = await apiClient.get<SavingsCalculatorEntry[]>('/savings-calculator');
  return response.data;
};

export const fetchSavingsEntryById = async (id: string): Promise<SavingsCalculatorEntry> => {
  const response = await apiClient.get<SavingsCalculatorEntry>(`/savings-calculator/${id}`);
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

export const calculateSavings = async (id: string, month?: string): Promise<CalculationResult> => {
  const url = month ? `/savings-calculator/${id}/calculate?month=${encodeURIComponent(month)}` : `/savings-calculator/${id}/calculate`;
  const response = await apiClient.post<CalculationResult>(url);
  return response.data;
};
