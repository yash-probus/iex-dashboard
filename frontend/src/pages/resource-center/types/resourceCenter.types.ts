export interface RegionState {
  id?: number;
  regionalGrid: string;
  regionCode: string;
  regionName: string;
  stateName: string;
  stateCode: string;
  stateOrUt: string;
  updatedAt?: string;
}

export interface DiscomList {
  id?: number;
  code: string;
  legalName: string;
  stateCode: string;
  discomType: string;
  updatedAt?: string;
}

export interface IstsCharges {
  id?: string;
  startDate: string;
  endDate: string;
  istsLossPercent: number;
  updatedAt?: string;
}

export interface IexFees {
  id?: number;
  month: number;
  exchangeFees: number;
  exchangeFeesGst: number;
  nldcApplicationFees: number;
  nldcSchedulingFees: number;
  sldcSchedulingFees: number;
  otherFixCharges: number;
  updatedAt?: string;
}

export interface ProltMargin {
  id?: number;
  month: number;
  customerId: string;
  tradingMargin: number;
  tradingMarginGst: number;
  proltMargin: number;
  proltMarginGst: number;
  updatedAt?: string;
}

export interface CtuCharges {
  id?: string;
  state: string;
  month: number;
  ctu_charges_rs_per_kwh: number;
  updatedAt?: string;
}

export interface StuCharges {
  id?: number;
  stateCode: string;
  state: string;
  category: string;
  subCategory: string;
  voltageLevel: string;
  month: number;
  stuChargesRsPerKwh: number;
  demandCharges: number;
  percentFppaCharges: number;
  additionalCharges: number;
  crossSubsidy: number;
  distributionWheelingChargesRsPerKwh: number;
  stuLossPercent: number;
  distributionWheelingLossPercent: number;
  updatedAt?: string;
}

export interface StateTariff {
  id?: number;
  state: string;
  consumerCategory: string;
  subCategory: string;
  supplyVoltageCategory: string;
  supplyVoltage: string;
  month: number;
  todStartTime: string;
  todEndTime: string;
  baseEnergyRate: number;
  baseEnergyUnit: string;
  todChargePercent: number;
  energyRate: number;
  updatedAt?: string;
}

