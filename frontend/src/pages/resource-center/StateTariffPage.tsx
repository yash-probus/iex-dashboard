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

// month is stored as YYYYMM integer (e.g. 202604)
const formatMonth = (m: any) => {
  const s = String(m);
  if (s.length === 6) {
    const year = s.slice(0, 4);
    const mon = parseInt(s.slice(4), 10);
    const date = new Date(parseInt(year), mon - 1);
    return date.toLocaleString('default', { month: 'short' }) + ' ' + year;
  }
  return String(m);
};

export default function StateTariffPage() {
  const { data, loading, error, refresh, bulkUpload } = useResourceData<StateTariff>('state-tariff');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.STATE_TARIFF;

  const filteredData = data.filter((row: StateTariff) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      String(row.state || '').toLowerCase().includes(lowerQuery) ||
      String(row.consumerCategory || '').toLowerCase().includes(lowerQuery) ||
      String(row.subCategory || '').toLowerCase().includes(lowerQuery) ||
      String(row.supplyVoltageCategory || '').toLowerCase().includes(lowerQuery) ||
      String(row.supplyVoltage || '').toLowerCase().includes(lowerQuery) ||
      String(row.baseEnergyUnit || '').toLowerCase().includes(lowerQuery) ||
      String(row.energyRate).includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : v;

  const columns: ColumnDefinition[] = [
    { field: 'state', headerName: 'State', align: 'center', width: 180, sticky: true },
    { field: 'consumerCategory', headerName: 'Consumer Category', align: 'center', width: 160 },
    { field: 'subCategory', headerName: 'Sub Category', align: 'center', width: 260 },
    { field: 'supplyVoltageCategory', headerName: 'Supply Voltage Category', align: 'center', width: 220 },
    { field: 'supplyVoltage', headerName: 'Supply Voltage', align: 'center', width: 150 },
    { field: 'month', headerName: 'Month', align: 'center', width: 120, valueFormatter: formatMonth },
    { field: 'todStartTime', headerName: 'TOD Start Time', align: 'center', width: 150 },
    { field: 'todEndTime', headerName: 'TOD End Time', align: 'center', width: 150 },
    { field: 'baseEnergyRate', headerName: 'Base Energy Rate', align: 'center', width: 180, valueFormatter: formatNum },
    { field: 'baseEnergyUnit', headerName: 'Unit', align: 'center', width: 100 },
    { field: 'todChargePercent', headerName: 'TOD Charge %', align: 'center', width: 150 },
    { field: 'energyRate', headerName: 'Energy Rate', align: 'center', width: 150, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'State': row.state,
      'Consumer Category': row.consumerCategory,
      'Sub Category': row.subCategory,
      'Supply Voltage Category': row.supplyVoltageCategory,
      'Supply Voltage': row.supplyVoltage,
      'Month': formatMonth(row.month),
      'TOD Start Time': row.todStartTime,
      'TOD End Time': row.todEndTime,
      'Base Energy Rate': row.baseEnergyRate,
      'Base Energy Unit': row.baseEnergyUnit,
      'TOD Charge %': row.todChargePercent,
      'Energy Rate': row.energyRate,
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout lastUpdated={data.length > 0 ? data.reduce((latest: any, r: any) => !r.updatedAt || (latest && latest > r.updatedAt) ? latest : r.updatedAt, null) : null} resourceType="state-tariff"
      title={config.title}
      subtitle={config.subtitle}
      icon={<PriceCheckIcon fontSize="large" />}
      iconColor="#EF4444"
      iconBgColor="#EF444415"
      totalRecords={filteredData.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={config.searchPlaceholder}
      onUpload={async (parsedData) => {
        try {
          await bulkUpload(parsedData);
          refresh();
          alert('Upload successful!');
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        }
      }}
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

