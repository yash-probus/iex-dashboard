import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Bolt as BoltIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { IstsCharges } from './types/resourceCenter.types';

export default function IstsChargesPage() {
  const { data, loading, error, refresh, bulkUpload } = useResourceData<IstsCharges>('ists-charges');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.ISTS_LOSSES;

  const filteredData = data.filter((row: IstsCharges) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      String(row.id || '').toLowerCase().includes(lowerQuery) ||
      String(row.startDate || '').toLowerCase().includes(lowerQuery) ||
      String(row.endDate || '').toLowerCase().includes(lowerQuery) ||
      String(row.istsLossPercent).includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;
  const formatDate = (v: unknown) => v ? String(v).split('T')[0] : '-';

  const columns: ColumnDefinition[] = [
    { field: 'id', headerName: 'ID', align: 'center', width: 150 },
    { field: 'startDate', headerName: 'Start Date', align: 'center', width: 200, valueFormatter: formatDate },
    { field: 'endDate', headerName: 'End Date', align: 'center', width: 200, valueFormatter: formatDate },
    { field: 'istsLossPercent', headerName: 'ISTS Loss %', align: 'center', width: 200, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'ID': row.id,
      'Start Date': row.startDate,
      'End Date': row.endDate,
      'ISTS Loss %': row.istsLossPercent
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout lastUpdated={data.length > 0 ? data.reduce((latest: any, r: any) => !r.updatedAt || (latest && latest > r.updatedAt) ? latest : r.updatedAt, null) : null} resourceType="ists-charges"
      title={config.title}
      subtitle={config.subtitle}
      icon={<BoltIcon fontSize="large" />}
      iconColor="#E53935"
      iconBgColor="#E5393515"
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
