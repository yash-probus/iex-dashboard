import React, { useState, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract unique years from data for the filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach((row: IstsCharges) => {
      if (row.startDate) {
        years.add(row.startDate.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse(); // Newest first
  }, [data]);

  const filteredData = data.filter((row: IstsCharges) => {
    // Apply year filter
    if (selectedYear !== 'all' && row.startDate && !row.startDate.startsWith(selectedYear)) {
      return false;
    }
    
    // Apply month filter
    if (selectedMonth !== 'all' && row.startDate) {
      const rowMonth = row.startDate.substring(5, 7);
      if (rowMonth !== selectedMonth) {
        return false;
      }
    }

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
      customFilters={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="year-filter-label">Year</InputLabel>
            <Select
              labelId="year-filter-label"
              id="year-filter"
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <MenuItem value="all">All Years</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="month-filter-label">Month</InputLabel>
            <Select
              labelId="month-filter-label"
              id="month-filter"
              value={selectedMonth}
              label="Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <MenuItem value="all">All Months</MenuItem>
              <MenuItem value="01">January</MenuItem>
              <MenuItem value="02">February</MenuItem>
              <MenuItem value="03">March</MenuItem>
              <MenuItem value="04">April</MenuItem>
              <MenuItem value="05">May</MenuItem>
              <MenuItem value="06">June</MenuItem>
              <MenuItem value="07">July</MenuItem>
              <MenuItem value="08">August</MenuItem>
              <MenuItem value="09">September</MenuItem>
              <MenuItem value="10">October</MenuItem>
              <MenuItem value="11">November</MenuItem>
              <MenuItem value="12">December</MenuItem>
            </Select>
          </FormControl>
        </Box>
      }
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
