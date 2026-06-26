import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { DeviceHub as DeviceHubIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { StuCharges } from './types/resourceCenter.types';

const formatMonth = (m: any) => {
  const date = new Date(2026, m - 1);
  return date.toLocaleString('default', { month: 'short' }) + ' 2026';
};

export default function StuChargesPage() {
  const { data, loading, error } = useResourceData<StuCharges>('stu-charges');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.STU_CHARGES;

  const filteredData = data.filter((row: StuCharges) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      String(row.stateCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.state || '').toLowerCase().includes(lowerQuery) ||
      String(row.category || '').toLowerCase().includes(lowerQuery) ||
      String(row.subCategory || '').toLowerCase().includes(lowerQuery) ||
      String(row.stuChargesRsPerKwh).includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

  const columns: ColumnDefinition[] = [
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
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'State Code': row.stateCode,
      'State': row.state,
      'Category': row.category,
      'Sub Category': row.subCategory,
      'Voltage Level': row.voltageLevel,
      'Month': formatMonth(row.month),
      'STU Charges (₹/kWh)': row.stuChargesRsPerKwh,
      'Demand Charges': row.demandCharges,
      'FPPA Charges (%)': row.percentFppaCharges,
      'Additional Charges': row.additionalCharges,
      'Cross Subsidy': row.crossSubsidy,
      'Distribution Wheeling Charges (₹/kWh)': row.distributionWheelingChargesRsPerKwh,
      'STU Loss (%)': row.stuLossPercent,
      'Distribution Wheeling Loss (%)': row.distributionWheelingLossPercent
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<DeviceHubIcon fontSize="large" />}
      iconColor="#10B981"
      iconBgColor="#10B98115"
      totalRecords={filteredData.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={config.searchPlaceholder}
      onExport={handleExport}
      isExportDisabled={filteredData.length === 0}
    >
      <TableContainer 
        title={`${config.title} Records`}
        data={filteredData}
        columns={columns}
        loading={loading}
        emptyStateMessage={
          <EmptyTableState 
            title="No records available" 
            description={config.emptyMessage}
          />
        }
      />
    </ResourcePageLayout>
  );
}
