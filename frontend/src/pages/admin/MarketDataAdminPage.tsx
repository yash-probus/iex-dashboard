import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import ActionButton from '../../components/common/ActionButton';
import UploadModal from '../../components/admin/UploadModal';
import SummaryCards from '../../components/admin/SummaryCards';
import DatasetTable from '../../components/admin/DatasetTable';
import UploadHistoryTable from '../../components/admin/UploadHistoryTable';

export default function MarketDataAdminPage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshTriggered = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h1" sx={{ color: 'text.primary', mb: 0.5 }}>
            Data Management
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Upload, replace, and manage market datasets.
          </Typography>
        </Box>
        <ActionButton 
          variant="primary" 
          startIcon={<UploadIcon />} 
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Data
        </ActionButton>
      </Box>

      <SummaryCards refreshTrigger={refreshTrigger} />
      
      <DatasetTable 
        refreshTrigger={refreshTrigger} 
        onRefreshTriggered={handleRefreshTriggered} 
      />

      <UploadHistoryTable refreshTrigger={refreshTrigger} />

      <UploadModal 
        open={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onUploadSuccess={handleRefreshTriggered}
      />
    </Box>
  );
}
