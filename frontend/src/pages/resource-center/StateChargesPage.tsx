import React, { useState } from 'react';
import { AccountTree as AccountTreeIcon } from '@mui/icons-material';
import ResourcePageLayout from '../../components/dashboard/ResourcePageLayout';
import EmptyTableState from '../../components/dashboard/EmptyTableState';
import TableContainer, { ColumnDefinition } from '../../components/dashboard/TableContainer';
import { exportToCSV } from '../../utils/export';
import { useResourceData } from '../../hooks/useResourceData';
import { RESOURCE_CENTER_PAGES } from './constants/resourceCenter.constants';
import { StateCharges } from './types/resourceCenter.types';

export default function StateChargesPage() {
  const { data, loading, error, refresh, bulkUpload } = useResourceData<StateCharges>('state-charges');
  const [searchQuery, setSearchQuery] = useState('');
  const config = RESOURCE_CENTER_PAGES.STATE_CHARGES;

  const filteredData = data.filter((row: StateCharges) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const stateStr = String(row.state).toLowerCase();
    const catStr = String(row.category || '').toLowerCase();
    const subCatStr = String(row.subCategory || '').toLowerCase();
    
    return (
      stateStr.includes(lowerQuery) ||
      catStr.includes(lowerQuery) ||
      subCatStr.includes(lowerQuery)
    );
  });

  const formatNum = (v: any) => v != null ? Number(v).toFixed(4) : '-';
  const formatDate = (v: any) => v ? new Date(v).toLocaleDateString() : '-';

  const columns: ColumnDefinition[] = [
    { field: 'id', headerName: 'ID', align: 'center', width: 80 },
    { field: 'state', headerName: 'State', align: 'center', width: 150 },
    { field: 'category', headerName: 'Category', align: 'center', width: 150 },
    { field: 'subCategory', headerName: 'Sub Category', align: 'center', width: 250 },
    { field: 'supplyVoltageCategory', headerName: 'Supply Voltage Category', align: 'center', width: 200 },
    { field: 'voltageLevel', headerName: 'Voltage Level', align: 'center', width: 150 },
    { field: 'fromDate', headerName: 'From Date', align: 'center', width: 120, valueFormatter: formatDate },
    { field: 'toDate', headerName: 'To Date', align: 'center', width: 120, valueFormatter: formatDate },
    { field: 'demandFixedChargeKvaPerMonthRs', headerName: 'Demand Fixed Charge (Rs/kVA/mo)', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'crossSubsidy', headerName: 'Cross Subsidy', align: 'center', width: 150, valueFormatter: formatNum },
    { field: 'distributionWheelingCharges', headerName: 'Dist/Wheeling Charges', align: 'center', width: 200, valueFormatter: formatNum },
    { field: 'stuCharges', headerName: 'STU Charges', align: 'center', width: 150, valueFormatter: formatNum },
    { field: 'stuLossPercent', headerName: 'STU Loss (%)', align: 'center', width: 150, valueFormatter: formatNum },
    { field: 'wheelingLossPercent', headerName: 'Wheeling Loss (%)', align: 'center', width: 150, valueFormatter: formatNum },
    { field: 'additionalCharge', headerName: 'Additional Charge', align: 'center', width: 150, valueFormatter: formatNum },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((row: any) => ({
      'ID': row.id,
      'State': row.state,
      'Category': row.category,
      'Sub Category': row.subCategory,
      'Supply Voltage Category': row.supplyVoltageCategory,
      'Voltage Level': row.voltageLevel,
      'From Date': formatDate(row.fromDate),
      'To Date': formatDate(row.toDate),
      'Demand Fixed Charge (Rs/kVA/mo)': row.demandFixedChargeKvaPerMonthRs,
      'Cross Subsidy': row.crossSubsidy,
      'Dist/Wheeling Charges': row.distributionWheelingCharges,
      'STU Charges': row.stuCharges,
      'STU Loss (%)': row.stuLossPercent,
      'Wheeling Loss (%)': row.wheelingLossPercent,
      'Additional Charge': row.additionalCharge
    }));
    exportToCSV(exportData, config.exportFilename);
  };

  return (
    <ResourcePageLayout lastUpdated={data.length > 0 ? data.reduce((latest: any, r: any) => !r.updatedAt || (latest && latest > r.updatedAt) ? latest : r.updatedAt, null) : null} resourceType="state-charges"
      title={config.title}
      subtitle={config.subtitle}
      icon={<AccountTreeIcon fontSize="large" />}
      iconColor="#8B5CF6"
      iconBgColor="#8B5CF615"
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
