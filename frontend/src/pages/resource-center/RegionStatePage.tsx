import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Map as MapIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RegionState } from './types/resourceCenter.types';

export default function RegionStatePage() {
  const { data, loading, error } = useResourceData<RegionState>('region-state');
  const [searchQuery, setSearchQuery] = useState('');

  const config = {
    title: 'REGION STATE',
    subtitle: 'Reference data for regions, states, and union territories.',
    searchPlaceholder: 'Search by state, region code, region name...',
    emptyMessage: 'No Region State data available.'
  };

  // 1. Search Logic
  const filteredData = data.filter((row: RegionState) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      String(row.regionalGrid || '').toLowerCase().includes(lowerQuery) ||
      String(row.regionCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.regionName || '').toLowerCase().includes(lowerQuery) ||
      String(row.stateName || '').toLowerCase().includes(lowerQuery) ||
      String(row.stateCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.stateOrUt || '').toLowerCase().includes(lowerQuery)
    );
  });

  // 2. Column Configuration
  const columns: ColumnDefinition[] = [
    { field: 'regionalGrid', headerName: 'Regional Grid', align: 'center', width: 200 },
    { field: 'regionCode', headerName: 'Region Code', align: 'center', width: 150 },
    { field: 'regionName', headerName: 'Region Name', align: 'center', width: 250 },
    { field: 'stateName', headerName: 'State Name', align: 'center', width: 250 },
    { field: 'stateCode', headerName: 'State Code', align: 'center', width: 150 },
    { field: 'stateOrUt', headerName: 'State / UT', align: 'center', width: 150 },
  ];

  // 3. Export Logic
  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'Regional Grid': row.regionalGrid,
      'Region Code': row.regionCode,
      'Region Name': row.regionName,
      'State Name': row.stateName,
      'State Code': row.stateCode,
      'State / UT': row.stateOrUt
    }));
    exportToCSV(exportData, 'region-state');
  };

  return (
    <ResourcePageLayout
      title={config.title}
      subtitle={config.subtitle}
      icon={<MapIcon fontSize="large" />}
      iconColor="#F29F67"
      iconBgColor="#F29F6715"
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
          error ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <EmptyTableState 
              title="No records available" 
              description={config.emptyMessage}
            />
          )
        }
      />
    </ResourcePageLayout>
  );
}
