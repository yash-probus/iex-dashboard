import React from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon, FileDownload as DownloadIcon, FileUpload as UploadIcon } from '@mui/icons-material';
import ActionButton from '../common/ActionButton';
import Papa from 'papaparse';

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
  onUpload?: (data: any[]) => void;
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
  onUpload,
  onExport,
  isExportDisabled = false,
  children
}: ResourcePageLayoutProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        onUpload(results.data);
      },
      error: (err: any) => {
        alert('Error parsing CSV: ' + err.message);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
          <input
            type="file"
            accept=".csv"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <ActionButton
            variant="secondary"
            startIcon={<UploadIcon fontSize="small" />}
            onClick={() => {
              if (onUpload) {
                fileInputRef.current?.click();
              } else {
                alert('Upload functionality coming soon!');
              }
            }}
          >
            Upload Data
          </ActionButton>
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
