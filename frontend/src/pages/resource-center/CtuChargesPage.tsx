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
    const yearStr = String(row.year);
    return (
      monthStr.includes(lowerQuery) ||
      yearStr.includes(lowerQuery)
    );
  });

  const columns: ColumnDefinition[] = [
    { field: 'id', headerName: 'ID', align: 'center', width: 100 },
    { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
    { field: 'year', headerName: 'Year', align: 'center', width: 150 },
    { 
      field: 'pdfUrl', 
      headerName: 'Document', 
      align: 'center', 
      width: 250,
      renderCell: (row) => (
        <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#EC4899', textDecoration: 'none', fontWeight: 'bold' }}>
          Download PDF
        </a>
      )
    },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'ID': row.id,
      'Month': formatMonth(row.month),
      'Year': row.year,
      'PDF Link': row.pdfUrl
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
