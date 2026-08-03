import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { FppaCharges } from './types/resourceCenter.types';

export default function FppaChargesPage() {
  const { data, loading, error, refresh, bulkUpload } = useResourceData<FppaCharges>('fppa-charges');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.FPPA_CHARGES;

  const filteredData = data.filter((row: FppaCharges) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      String(row.id || '').toLowerCase().includes(lowerQuery) ||
      String(row.state || '').toLowerCase().includes(lowerQuery) ||
      String(row.month || '').toLowerCase().includes(lowerQuery)
    );
  });

  const formatNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : v;

  const columns: ColumnDefinition[] = [
    { field: 'id', headerName: 'ID', align: 'center', width: 100 },
    { field: 'state', headerName: 'State', align: 'center', width: 250 },
    { field: 'discom', headerName: 'Discom', align: 'center', width: 250 },
    { field: 'month', headerName: 'Month', align: 'center', width: 150 },
    { field: 'fppaChargePercent', headerName: 'FPPA Charge %', align: 'center', width: 250, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'ID': row.id,
      'State': row.state,
      'Discom': row.discom || '-',
      'Month': row.month,
      'FPPA Charge %': row.fppaChargePercent
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout lastUpdated={data.length > 0 ? data.reduce((latest: any, r: any) => !r.updatedAt || (latest && latest > r.updatedAt) ? latest : r.updatedAt, null) : null} resourceType="fppa-charges"
      title={config.title}
      subtitle={config.subtitle}
      icon={<ReceiptIcon fontSize="large" />}
      iconColor="#E0B50F"
      iconBgColor="#E0B50F15"
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
