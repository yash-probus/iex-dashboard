import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ShowChart as ShowChartIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { ProltMargin } from './types/resourceCenter.types';

const formatMonth = (m: any) => {
  const date = new Date(2026, m - 1);
  return date.toLocaleString('default', { month: 'short' }) + ' 2026';
};

export default function ProltMarginPage() {
  const { data, loading, error } = useResourceData<ProltMargin>('prolt-margin');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.PROLT_MARGIN;

  const filteredData = data.filter((row: ProltMargin) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      String(row.customerId || '').toLowerCase().includes(lowerQuery) ||
      String(row.tradingMargin).toLowerCase().includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

  const columns: ColumnDefinition[] = [
    { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
    { field: 'customerId', headerName: 'Customer ID', align: 'center', width: 200 },
    { field: 'tradingMargin', headerName: 'Trading Margin', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'tradingMarginGst', headerName: 'Trading Margin GST', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'proltMargin', headerName: 'ProLT Margin', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'proltMarginGst', headerName: 'ProLT Margin GST', align: 'center', width: 200, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'Month': formatMonth(row.month),
      'Customer ID': row.customerId,
      'Trading Margin': row.tradingMargin,
      'Trading Margin GST': row.tradingMarginGst,
      'ProLT Margin': row.proltMargin,
      'ProLT Margin GST': row.proltMarginGst
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<ShowChartIcon fontSize="large" />}
      iconColor="#8B5CF6"
      iconBgColor="#8B5CF615"
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
