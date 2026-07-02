import React from 'react';
import { Paper, Box, Button, TextField, MenuItem } from '@mui/material';
import { FilterList as FilterIcon, Refresh as RefreshIcon, FileDownload as DownloadIcon } from '@mui/icons-material';
import { IntervalFilter, MarketFilters } from '../../hooks/useMarketFilters';
import ActionButton from '../common/ActionButton';

interface FilterContainerProps {
  accentColor?: string;
  filters: MarketFilters;
  onDateChange: (date: string) => void;
  onIntervalChange: (interval: IntervalFilter) => void;
  onExport?: () => void;
  onManageData?: () => void;
  hideHourlyDaily?: boolean;
}

export default function FilterContainer({ 
  accentColor = 'primary.main',
  filters,
  onDateChange,
  onIntervalChange,
  onExport,
  onManageData,
  hideHourlyDaily
}: FilterContainerProps) {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', pr: 2, borderRight: '1px solid', borderColor: 'divider' }}>
          <FilterIcon fontSize="small" sx={{ color: accentColor }} />
          <Box component="span" sx={{ fontSize: '13px', fontWeight: 600 }}>Filters</Box>
        </Box>
        
        <TextField
          type="date"
          size="small"
          value={filters.date}
          onChange={(e) => onDateChange(e.target.value)}
          sx={{ 
            minWidth: 160, 
            '& .MuiInputBase-root': { fontSize: '13px', backgroundColor: 'background.default', borderRadius: 1.5 } 
          }}
          inputProps={{ max: '2050-12-31' }}
        />

        <TextField
          select
          size="small"
          value={filters.interval}
          onChange={(e) => onIntervalChange(e.target.value as IntervalFilter)}
          sx={{ 
            minWidth: 130, 
            '& .MuiInputBase-root': { fontSize: '13px', backgroundColor: 'background.default', borderRadius: 1.5 } 
          }}
        >
          <MenuItem value="15min" sx={{ fontSize: '13px' }}>15 Minute</MenuItem>
          {!hideHourlyDaily && (
            <>
              <MenuItem value="hourly" sx={{ fontSize: '13px' }}>Hourly</MenuItem>
              <MenuItem value="daily" sx={{ fontSize: '13px' }}>Daily</MenuItem>
            </>
          )}
        </TextField>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {onManageData && (
          <ActionButton 
            variant="secondary" 
            onClick={onManageData}
            accentColor={accentColor}
          >
            Manage Data
          </ActionButton>
        )}
        <ActionButton 
          variant="secondary" 
          startIcon={<DownloadIcon fontSize="small" />} 
          onClick={onExport}
          accentColor={accentColor}
        >
          Export Data
        </ActionButton>
      </Box>
    </Paper>
  );
}
