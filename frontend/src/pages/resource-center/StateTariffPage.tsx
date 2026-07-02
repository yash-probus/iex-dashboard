import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { PriceCheck as PriceCheckIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { StateTariff } from './types/resourceCenter.types';

const formatMonth = (m: any) => {
  const date = new Date(2026, m - 1);
  return date.toLocaleString('default', { month: 'short' }) + ' 2026';
};

export default function StateTariffPage() {
  const { data, loading, error } = useResourceData<StateTariff>('state-tariff');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.STATE_TARIFF;

  const filteredData = data.filter((row: StateTariff) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      String(row.stateCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.state || '').toLowerCase().includes(lowerQuery) ||
      String(row.tod || '').toLowerCase().includes(lowerQuery) ||
      String(row.voltageLevel || '').toLowerCase().includes(lowerQuery) ||
      String(row.category || '').toLowerCase().includes(lowerQuery) ||
      String(row.subCategory || '').toLowerCase().includes(lowerQuery) ||
      String(row.todName || '').toLowerCase().includes(lowerQuery) ||
      String(row.energyCharges).includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

  const columns: ColumnDefinition[] = [
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
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'State Code': row.stateCode,
      'State': row.state,
      'Month': formatMonth(row.month),
      'Category': row.category,
      'Sub Category': row.subCategory,
      'Voltage Level': row.voltageLevel,
      'TOD': row.tod,
      'TOD Name': row.todName,
      'Season': row.season,
      'TOD Start Hour': row.todStartHour,
      'TOD End Hour': row.todEndHour,
      'Base Energy Charges': row.baseEnergyCharges,
      'TOD Rate': row.todRate,
      'Energy Charges': row.energyCharges
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<PriceCheckIcon fontSize="large" />}
      iconColor="#EF4444"
      iconBgColor="#EF444415"
      totalRecords={filteredData.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={config.searchPlaceholder}
      onExport={handleExport}
      isExportDisabled={filteredData.length === 0}
    >
      <TableContainer 
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
