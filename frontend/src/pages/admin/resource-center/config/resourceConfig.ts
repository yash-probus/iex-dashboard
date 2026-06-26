import { ColumnDefinition } from '../../../../components/dashboard/TableContainer';

export type FieldType = 'text' | 'number' | 'dropdown';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
}

export interface ResourceConfig {
  title: string;
  subtitle: string;
  exportFilename: string;
  emptyMessage: string;
  searchPlaceholder: string;
  searchableFields: string[];
  columns: ColumnDefinition[];
  fields: FormField[];
}

const formatMonth = (v: any) => {
  if (typeof v === 'number') {
    const date = new Date(2026, v - 1);
    return date.toLocaleString('default', { month: 'short' }) + ' 2026';
  }
  return v;
};

const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

export const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  'region-state': {
    title: 'REGION STATE',
    subtitle: 'Manage Region State records.',
    exportFilename: 'region-state',
    emptyMessage: 'No Region State data available.',
    searchPlaceholder: 'Search by state, region code, region name...',
    searchableFields: ['regionalGrid', 'regionCode', 'regionName', 'stateName', 'stateCode', 'stateOrUt'],
    columns: [
      { field: 'regionalGrid', headerName: 'Regional Grid', align: 'center', width: 200 },
      { field: 'regionCode', headerName: 'Region Code', align: 'center', width: 150 },
      { field: 'regionName', headerName: 'Region Name', align: 'center', width: 250 },
      { field: 'stateName', headerName: 'State Name', align: 'center', width: 250 },
      { field: 'stateCode', headerName: 'State Code', align: 'center', width: 150 },
      { field: 'stateOrUt', headerName: 'State / UT', align: 'center', width: 150 },
    ],
    fields: [
      { name: 'regionalGrid', label: 'Regional Grid', type: 'text' },
      { name: 'regionCode', label: 'Region Code', type: 'text' },
      { name: 'regionName', label: 'Region Name', type: 'text' },
      { name: 'stateName', label: 'State Name', type: 'text' },
      { name: 'stateCode', label: 'State Code', type: 'text' },
      { name: 'stateOrUt', label: 'State / UT', type: 'dropdown', options: [{ label: 'State', value: 'State' }, { label: 'UT', value: 'UT' }] },
    ]
  },
  'discom-list': {
    title: 'DISCOM LIST',
    subtitle: 'Manage Discom List records.',
    exportFilename: 'discom-list',
    emptyMessage: 'No Discom List data available.',
    searchPlaceholder: 'Search by code, legal name, state code...',
    searchableFields: ['code', 'legalName', 'stateCode', 'discomType'],
    columns: [
      { field: 'code', headerName: 'Code', align: 'center', width: 150 },
      { field: 'legalName', headerName: 'Legal Name', align: 'center', width: 400 },
      { field: 'stateCode', headerName: 'State Code', align: 'center', width: 150 },
      { field: 'discomType', headerName: 'Discom Type', align: 'center', width: 200 },
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'text' },
      { name: 'legalName', label: 'Legal Name', type: 'text' },
      { name: 'stateCode', label: 'State Code', type: 'text' },
      { name: 'discomType', label: 'Discom Type', type: 'text' },
    ]
  },
  'ists-charges': {
    title: 'ISTS CHARGES',
    subtitle: 'Manage ISTS Charges records.',
    exportFilename: 'ists-charges',
    emptyMessage: 'No ISTS Charges data available.',
    searchPlaceholder: 'Search by state, date, ISTS loss...',
    searchableFields: ['id', 'state', 'date', 'istsLossPercent'],
    columns: [
      { field: 'id', headerName: 'ID', align: 'center', width: 150 },
      { field: 'state', headerName: 'State', align: 'center', width: 250 },
      { field: 'date', headerName: 'Date', align: 'center', width: 150 },
      { field: 'istsLossPercent', headerName: 'ISTS Loss %', align: 'center', width: 200, valueFormatter: formatNum },
    ],
    fields: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'date', label: 'Date', type: 'text' },
      { name: 'istsLossPercent', label: 'ISTS Loss %', type: 'number' },
    ]
  },
  'iex-fees': {
    title: 'IEX FEES',
    subtitle: 'Manage IEX Fees records.',
    exportFilename: 'iex-fees',
    emptyMessage: 'No IEX Fees data available.',
    searchPlaceholder: 'Search by month, fees, charges...',
    searchableFields: ['month', 'exchangeFees', 'nldcApplicationFees'],
    columns: [
      { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
      { field: 'exchangeFees', headerName: 'Exchange Fees', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'exchangeFeesGst', headerName: 'Exchange Fees GST', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'nldcApplicationFees', headerName: 'NLDC Application Fees', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'nldcSchedulingFees', headerName: 'NLDC Scheduling Fees', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'sldcSchedulingFees', headerName: 'SLDC Scheduling Fees', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'otherFixCharges', headerName: 'Other Fixed Charges', align: 'center', width: 200, valueFormatter: formatNum },
    ],
    fields: [
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'exchangeFees', label: 'Exchange Fees', type: 'number' },
      { name: 'exchangeFeesGst', label: 'Exchange Fees GST', type: 'number' },
      { name: 'nldcApplicationFees', label: 'NLDC Application Fees', type: 'number' },
      { name: 'nldcSchedulingFees', label: 'NLDC Scheduling Fees', type: 'number' },
      { name: 'sldcSchedulingFees', label: 'SLDC Scheduling Fees', type: 'number' },
      { name: 'otherFixCharges', label: 'Other Fixed Charges', type: 'number' },
    ]
  },
  'prolt-margin': {
    title: 'PROLT MARGIN',
    subtitle: 'Manage ProLT Margin records.',
    exportFilename: 'prolt-margin',
    emptyMessage: 'No ProLT Margin data available.',
    searchPlaceholder: 'Search by customer ID, month, margin...',
    searchableFields: ['month', 'customerId', 'tradingMargin'],
    columns: [
      { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
      { field: 'customerId', headerName: 'Customer ID', align: 'center', width: 200 },
      { field: 'tradingMargin', headerName: 'Trading Margin', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'tradingMarginGst', headerName: 'Trading Margin GST', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'proltMargin', headerName: 'ProLT Margin', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'proltMarginGst', headerName: 'ProLT Margin GST', align: 'center', width: 200, valueFormatter: formatNum },
    ],
    fields: [
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'customerId', label: 'Customer ID', type: 'text' },
      { name: 'tradingMargin', label: 'Trading Margin', type: 'number' },
      { name: 'tradingMarginGst', label: 'Trading Margin GST', type: 'number' },
      { name: 'proltMargin', label: 'ProLT Margin', type: 'number' },
      { name: 'proltMarginGst', label: 'ProLT Margin GST', type: 'number' },
    ]
  },
  'ctu-charges': {
    title: 'CTU CHARGES',
    subtitle: 'Manage CTU Charges records.',
    exportFilename: 'ctu-charges',
    emptyMessage: 'No CTU Charges data available.',
    searchPlaceholder: 'Search by state, month, charges...',
    searchableFields: ['stateCode', 'state', 'month', 'ctuChargesRsPerKwh', 'dsmChargesRsPerKwh'],
    columns: [
      { field: 'stateCode', headerName: 'State Code', align: 'center', width: 150 },
      { field: 'state', headerName: 'State', align: 'center', width: 250 },
      { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
      { field: 'ctuChargesRsPerKwh', headerName: 'CTU Charges (₹/kWh)', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'dsmChargesRsPerKwh', headerName: 'DSM Charges (₹/kWh)', align: 'center', width: 200, valueFormatter: formatNum },
    ],
    fields: [
      { name: 'stateCode', label: 'State Code', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'ctuChargesRsPerKwh', label: 'CTU Charges (₹/kWh)', type: 'number' },
      { name: 'dsmChargesRsPerKwh', label: 'DSM Charges (₹/kWh)', type: 'number' },
    ]
  },
  'stu-charges': {
    title: 'STU CHARGES',
    subtitle: 'Manage STU Charges records.',
    exportFilename: 'stu-charges',
    emptyMessage: 'No STU Charges data available.',
    searchPlaceholder: 'Search by state, category, sub category...',
    searchableFields: ['stateCode', 'state', 'category', 'subCategory', 'month', 'stuChargesRsPerKwh'],
    columns: [
      { field: 'stateCode', headerName: 'State Code', align: 'center', width: 120, sticky: true },
      { field: 'state', headerName: 'State', align: 'center', width: 180, sticky: true },
      { field: 'category', headerName: 'Category', align: 'center', width: 180 },
      { field: 'subCategory', headerName: 'Sub Category', align: 'center', width: 180 },
      { field: 'voltageLevel', headerName: 'Voltage Level', align: 'center', width: 150 },
      { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
      { field: 'stuChargesRsPerKwh', headerName: 'STU Charges (₹/kWh)', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'demandCharges', headerName: 'Demand Charges', align: 'center', width: 180, valueFormatter: formatNum },
      { field: 'percentFppaCharges', headerName: 'FPPA Charges (%)', align: 'center', width: 180, valueFormatter: formatNum },
      { field: 'additionalCharges', headerName: 'Additional Charges', align: 'center', width: 180, valueFormatter: formatNum },
      { field: 'crossSubsidy', headerName: 'Cross Subsidy', align: 'center', width: 180, valueFormatter: formatNum },
      { field: 'distributionWheelingChargesRsPerKwh', headerName: 'Distribution Wheeling Charges (₹/kWh)', align: 'center', width: 300, valueFormatter: formatNum },
      { field: 'stuLossPercent', headerName: 'STU Loss (%)', align: 'center', width: 150, valueFormatter: formatNum },
      { field: 'distributionWheelingLossPercent', headerName: 'Distribution Wheeling Loss (%)', align: 'center', width: 250, valueFormatter: formatNum },
    ],
    fields: [
      { name: 'stateCode', label: 'State Code', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'subCategory', label: 'Sub Category', type: 'text' },
      { name: 'voltageLevel', label: 'Voltage Level', type: 'text' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'stuChargesRsPerKwh', label: 'STU Charges (₹/kWh)', type: 'number' },
      { name: 'demandCharges', label: 'Demand Charges', type: 'number' },
      { name: 'percentFppaCharges', label: 'FPPA Charges (%)', type: 'number' },
      { name: 'additionalCharges', label: 'Additional Charges', type: 'number' },
      { name: 'crossSubsidy', label: 'Cross Subsidy', type: 'number' },
      { name: 'distributionWheelingChargesRsPerKwh', label: 'Distribution Wheeling Charges (₹/kWh)', type: 'number' },
      { name: 'stuLossPercent', label: 'STU Loss (%)', type: 'number' },
      { name: 'distributionWheelingLossPercent', label: 'Distribution Wheeling Loss (%)', type: 'number' },
    ]
  },
  'state-tariff': {
    title: 'STATE TARIFF',
    subtitle: 'Manage State Tariff records.',
    exportFilename: 'state-tariff',
    emptyMessage: 'No State Tariff data available.',
    searchPlaceholder: 'Search by state, TOD, voltage level...',
    searchableFields: ['stateCode', 'state', 'tod', 'voltageLevel', 'month', 'category', 'subCategory', 'todName'],
    columns: [
      { field: 'stateCode', headerName: 'State Code', align: 'center', width: 120, sticky: true },
      { field: 'state', headerName: 'State', align: 'center', width: 180, sticky: true },
      { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
      { field: 'category', headerName: 'Category', align: 'center', width: 180 },
      { field: 'subCategory', headerName: 'Sub Category', align: 'center', width: 180 },
      { field: 'voltageLevel', headerName: 'Voltage Level', align: 'center', width: 150 },
      { field: 'tod', headerName: 'TOD', align: 'center', width: 120 },
      { field: 'todName', headerName: 'TOD Name', align: 'center', width: 200 },
      { field: 'season', headerName: 'Season', align: 'center', width: 150 },
      { field: 'todStartHour', headerName: 'TOD Start Hour', align: 'center', width: 150 },
      { field: 'todEndHour', headerName: 'TOD End Hour', align: 'center', width: 150 },
      { field: 'baseEnergyCharges', headerName: 'Base Energy Charges', align: 'center', width: 200, valueFormatter: formatNum },
      { field: 'todRate', headerName: 'TOD Rate', align: 'center', width: 150, valueFormatter: formatNum },
      { field: 'energyCharges', headerName: 'Energy Charges', align: 'center', width: 180, valueFormatter: formatNum },
    ],
    fields: [
      { name: 'stateCode', label: 'State Code', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'subCategory', label: 'Sub Category', type: 'text' },
      { name: 'voltageLevel', label: 'Voltage Level', type: 'text' },
      { name: 'tod', label: 'TOD', type: 'text' },
      { name: 'todName', label: 'TOD Name', type: 'text' },
      { name: 'season', label: 'Season', type: 'text' },
      { name: 'todStartHour', label: 'TOD Start Hour', type: 'text' },
      { name: 'todEndHour', label: 'TOD End Hour', type: 'text' },
      { name: 'baseEnergyCharges', label: 'Base Energy Charges', type: 'number' },
      { name: 'todRate', label: 'TOD Rate', type: 'number' },
      { name: 'energyCharges', label: 'Energy Charges', type: 'number' },
    ]
  }
};
