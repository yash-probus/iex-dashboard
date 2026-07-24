import React, { useState } from 'react';
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
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
  const { data, loading, error, refresh, bulkUpload } = useResourceData<DiscomList>('discom-list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDiscomType, setSelectedDiscomType] = useState('all');
  const config = RESOURCE_CENTER_PAGES.DISCOM_LIST;

  const uniqueStates = Array.from(new Set(data.map((r: DiscomList) => r.stateCode).filter(Boolean))).sort();
  const uniqueDiscomTypes = Array.from(new Set(data.map((r: DiscomList) => r.discomType).filter(Boolean))).sort();

  const filteredData = data.filter((row: DiscomList) => {
    const lowerQuery = searchQuery.toLowerCase();
    
    const matchesSearch = !searchQuery || 
      String(row.code || '').toLowerCase().includes(lowerQuery) ||
      String(row.legalName || '').toLowerCase().includes(lowerQuery) ||
      String(row.stateCode || '').toLowerCase().includes(lowerQuery) ||
      String(row.discomType || '').toLowerCase().includes(lowerQuery);

    const matchesState = selectedState === 'all' || row.stateCode === selectedState;
    const matchesDiscomType = selectedDiscomType === 'all' || row.discomType === selectedDiscomType;

    return matchesSearch && matchesState && matchesDiscomType;
  });

  const columns: ColumnDefinition[] = [
    { field: 'code', headerName: 'Code', align: 'center', width: 150 },
    { field: 'legalName', headerName: 'Discom Name', align: 'center', width: 400 },
    { field: 'stateCode', headerName: 'State Name', align: 'center', width: 150 },
    { field: 'discomType', headerName: 'Discom Type', align: 'center', width: 200 },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'Code': row.code,
      'Discom Name': row.legalName,
      'State Name': row.stateCode,
      'Discom Type': row.discomType
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout lastUpdated={data.length > 0 ? data.reduce((latest: any, r: any) => !r.updatedAt || (latest && latest > r.updatedAt) ? latest : r.updatedAt, null) : null} resourceType="discom-list"
      title={config.title}
      subtitle={config.subtitle}
      icon={<DomainIcon fontSize="large" />}
      iconColor="#00897B"
      iconBgColor="#00897B15"
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
      customFilters={
        <>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>State Name</InputLabel>
            <Select
              value={selectedState}
              label="State Name"
              onChange={(e) => setSelectedState(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All States</MenuItem>
              {uniqueStates.map((state) => (
                <MenuItem key={state as string} value={state as string}>{state as string}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Discom Type</InputLabel>
            <Select
              value={selectedDiscomType}
              label="Discom Type"
              onChange={(e) => setSelectedDiscomType(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All Types</MenuItem>
              {uniqueDiscomTypes.map((type) => (
                <MenuItem key={type as string} value={type as string}>{type as string}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      }
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
