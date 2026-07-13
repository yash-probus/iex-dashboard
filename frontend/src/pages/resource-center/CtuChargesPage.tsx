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
  const { data, loading, error, refresh, bulkUpload } = useResourceData<CtuCharges>('ctu-charges');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.CTU_CHARGES;

  const filteredData = data.filter((row: CtuCharges) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    const stateStr = String(row.state).toLowerCase();
    return (
      monthStr.includes(lowerQuery) ||
      stateStr.includes(lowerQuery)
    );
  });

  const formatNum = (v: any) => v != null ? Number(v).toFixed(2) : '-';

  const columns: ColumnDefinition[] = [
    { field: 'id', headerName: 'ID', align: 'center', width: 100 },
    { field: 'state', headerName: 'State', align: 'center', width: 200 },
    { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
    { field: 'ctu_charges_rs_per_kwh', headerName: 'CTU Charges (Rs/kWh)', align: 'center', width: 250, valueFormatter: formatNum },
    { field: 'updatedAt', headerName: 'Last Updated', align: 'center', width: 200, valueFormatter: (v: any) => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-' },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'ID': row.id,
      'State': row.state,
      'Month': formatMonth(row.month),
      'CTU Charges (Rs/kWh)': row.ctu_charges_rs_per_kwh
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout lastUpdated={data.length > 0 ? data.reduce((latest: any, r: any) => !r.updatedAt || (latest && latest > r.updatedAt) ? latest : r.updatedAt, null) : null} resourceType="ctu-charges"
      title={config.title}
      subtitle={config.subtitle}
      icon={<AccountTreeIcon fontSize="large" />}
      iconColor="#EC4899"
      iconBgColor="#EC489915"
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
