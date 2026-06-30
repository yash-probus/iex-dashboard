import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { CircularProgress } from '@mui/material';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { IexFees } from './types/resourceCenter.types';

const formatMonth = (m: any) => {
  const date = new Date(2026, m - 1);
  return date.toLocaleString('default', { month: 'short' }) + ' 2026';
};

export default function IexFeesPage() {
  const { data, loading, error } = useResourceData<IexFees>('iex-fees');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.IEX_FEES;

  const filteredData = data.filter((row: IexFees) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      String(row.exchangeFees).includes(lowerQuery) ||
      String(row.nldcApplicationFees).includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

  const columns: ColumnDefinition[] = [
    { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
    { field: 'exchangeFees', headerName: 'Exchange Fees', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'exchangeFeesGst', headerName: 'Exchange Fees GST', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'nldcApplicationFees', headerName: 'NLDC Application Fees', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'nldcSchedulingFees', headerName: 'NLDC Scheduling Fees', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'sldcSchedulingFees', headerName: 'SLDC Scheduling Fees', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'otherFixCharges', headerName: 'Other Fixed Charges', align: 'center', width: 200, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'Month': formatMonth(row.month),
      'Exchange Fees': row.exchangeFees,
      'Exchange Fees GST': row.exchangeFeesGst,
      'NLDC Application Fees': row.nldcApplicationFees,
      'NLDC Scheduling Fees': row.nldcSchedulingFees,
      'SLDC Scheduling Fees': row.sldcSchedulingFees,
      'Other Fixed Charges': row.otherFixCharges
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<ReceiptIcon fontSize="large" />}
      iconColor="#E0B50F"
      iconBgColor="#E0B50F15"
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
