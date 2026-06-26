import React from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon, FileDownload as DownloadIcon } from '@mui/icons-material';
import ActionButton from '../common/ActionButton';

interface ResourcePageLayoutProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  totalRecords: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  onExport: () => void;
  isExportDisabled?: boolean;
  children: React.ReactNode;
}

export default function ResourcePageLayout({
  title,
  subtitle,
  icon,
  iconColor = '#EC4899',
  iconBgColor = '#EC489915',
  totalRecords,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onExport,
  isExportDisabled = false,
  children
}: ResourcePageLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ color: iconColor, backgroundColor: iconBgColor, p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h1" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, mb: -2 }}>
        Total Records: {totalRecords}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: { xs: '100%', sm: 380 }, backgroundColor: 'background.paper', borderRadius: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
        />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <ActionButton 
            variant="secondary" 
            startIcon={<DownloadIcon fontSize="small" />} 
            onClick={onExport} 
            disabled={isExportDisabled}
          >
            Export Data
          </ActionButton>
        </Box>
      </Box>

      {children}
    </Box>
  );
}
