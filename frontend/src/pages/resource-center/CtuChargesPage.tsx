import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { AccountTree as AccountTreeIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { CircularProgress } from '@mui/material';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { CtuCharges } from './types/resourceCenter.types';

const formatMonth = (m: any) => {
  const date = new Date(2026, m - 1);
  return date.toLocaleString('default', { month: 'short' }) + ' 2026';
};

export default function CtuChargesPage() {
  const { data, loading, error } = useResourceData<CtuCharges>('ctu-charges');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.CTU_CHARGES;

  const filteredData = data.filter((row: CtuCharges) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      String(row.stateCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.state || '').toLowerCase().includes(lowerQuery) ||
      String(row.ctuChargesRsPerKwh).includes(lowerQuery) ||
      String(row.dsmChargesRsPerKwh).includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

  const columns: ColumnDefinition[] = [
    { field: 'stateCode', headerName: 'State Code', align: 'center', width: 150 },
    { field: 'state', headerName: 'State', align: 'center', width: 250 },
    { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
    { field: 'ctuChargesRsPerKwh', headerName: 'CTU Charges (₹/kWh)', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'dsmChargesRsPerKwh', headerName: 'DSM Charges (₹/kWh)', align: 'center', width: 200, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'State Code': row.stateCode,
      'State': row.state,
      'Month': formatMonth(row.month),
      'CTU Charges (₹/kWh)': row.ctuChargesRsPerKwh,
      'DSM Charges (₹/kWh)': row.dsmChargesRsPerKwh
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<AccountTreeIcon fontSize="large" />}
      iconColor="#EC4899"
      iconBgColor="#EC489915"
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
