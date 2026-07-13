export interface RegionState {
  regionalGrid: string;
  regionCode: string;
  regionName: string;
  stateName: string;
  stateCode: string;
  stateOrUt: string;
}

export interface DiscomList {
  code: string;
  legalName: string;
  stateCode: string;
  discomType: string;
}

export interface IstsCharges {
  id: string;
  startDate: string;
  endDate: string;
  istsLossPercent: number;
}

export interface IexFees {
  month: number;
  exchangeFees: number;
  exchangeFeesGst: number;
  nldcApplicationFees: number;
  nldcSchedulingFees: number;
  sldcSchedulingFees: number;
  otherFixCharges: number;
}

export interface ProltMargin {
  month: number;
  customerId: string;
  tradingMargin: number;
  tradingMarginGst: number;
  proltMargin: number;
  proltMarginGst: number;
}

export interface CtuCharges {
  id: string;
  state: string;
  month: number;
  ctu_charges_rs_per_kwh: number;
}

export interface StuCharges {
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
}

export interface StateTariff {
  stateCode: string;
  month: number;
  state: string;
  category: string;
  subCategory: string;
  voltageLevel: string;
  tod: string;
  todName: string;
  season: string;
  todStartHour: string;
  todEndHour: string;
  baseEnergyCharges: number;
  todRate: number;
  energyCharges: number;
}
