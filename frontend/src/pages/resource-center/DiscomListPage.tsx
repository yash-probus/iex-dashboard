import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Domain as DomainIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { DiscomList } from './types/resourceCenter.types';

export default function DiscomListPage() {
  const { data, loading, error } = useResourceData<DiscomList>('discom-list');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.DISCOM_LIST;

  const filteredData = data.filter((row: DiscomList) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      String(row.code || '').toLowerCase().includes(lowerQuery) ||
      String(row.legalName || '').toLowerCase().includes(lowerQuery) ||
      String(row.stateCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.discomType || '').toLowerCase().includes(lowerQuery)
    );
  });

  const columns: ColumnDefinition[] = [
    { field: 'code', headerName: 'Code', align: 'center', width: 150 },
    { field: 'legalName', headerName: 'Legal Name', align: 'center', width: 400 },
    { field: 'stateCode', headerName: 'State Code', align: 'center', width: 150 },
    { field: 'discomType', headerName: 'Discom Type', align: 'center', width: 200 },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'Code': row.code,
      'Legal Name': row.legalName,
      'State Code': row.stateCode,
      'Discom Type': row.discomType
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<DomainIcon fontSize="large" />}
      iconColor="#00897B"
      iconBgColor="#00897B15"
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
