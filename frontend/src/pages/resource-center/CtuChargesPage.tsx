import React, { useState } from 'react';
import { Box, Typography, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
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
  const [selectedState, setSelectedState] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const config = RESOURCE_CENTER_PAGES.CTU_CHARGES;

  // Extract unique states for the filter
  const uniqueStates = Array.from(new Set(data.map((r: CtuCharges) => r.state))).sort();
  // Generate some years for the filter (CTU charges typically have 2026, 2025, etc.)
  // If month is just 1-12, the system currently formats it as 2026.
  const uniqueYears = ['2026', '2025', '2024'];

  const filteredData = data.filter((row: CtuCharges) => {
    // Search query filter
    const lowerQuery = searchQuery.toLowerCase();
    const monthStr = formatMonth(row.month).toLowerCase();
    const stateStr = String(row.state).toLowerCase();
    const matchesSearch = !searchQuery || monthStr.includes(lowerQuery) || stateStr.includes(lowerQuery);

    // State filter
    const matchesState = selectedState === 'all' || row.state === selectedState;
    
    // Year filter (since we format month as 2026, we check the formatted string)
    const matchesYear = selectedYear === 'all' || monthStr.includes(selectedYear);

    return matchesSearch && matchesState && matchesYear;
  });

  const formatNum = (v: any) => v != null ? Number(v).toFixed(2) : '-';

  const columns: ColumnDefinition[] = [
    { field: 'id', headerName: 'ID', align: 'center', width: 100 },
    { field: 'state', headerName: 'State', align: 'center', width: 200 },
    { field: 'month', headerName: 'Month', align: 'center', width: 150, valueFormatter: formatMonth },
    { field: 'ctu_charges_rs_per_kwh', headerName: 'CTU Charges (Rs/kWh)', align: 'center', width: 250, valueFormatter: formatNum },
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
      customFilters={
        <>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>State</InputLabel>
            <Select
              value={selectedState}
              label="State"
              onChange={(e) => setSelectedState(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All States</MenuItem>
              {uniqueStates.map((state) => (
                <MenuItem key={state as string} value={state as string}>{state as string}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All Years</MenuItem>
              {uniqueYears.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
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
