import React, { useState, useEffect } from 'react';
import { Paper, Box, Button, TextField, MenuItem } from '@mui/material';
import { FilterList as FilterIcon, FileDownload as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import { IntervalFilter, MarketFilters } from '../../hooks/useMarketFilters';
import ActionButton from '../common/ActionButton';
import { State } from 'country-state-city';

interface FilterContainerProps {
  accentColor?: string;
  filters: MarketFilters;
  onSearch: (filters: MarketFilters, selectedState?: string) => void;
  onExport?: () => void;
  onManageData?: () => void;
  hideHourlyDaily?: boolean;
}

export default function FilterContainer({ 
  accentColor = 'primary.main',
  filters,
  onSearch,
  onExport,
  onManageData,
  hideHourlyDaily
}: FilterContainerProps) {
  const [localDate, setLocalDate] = useState(filters.date);
  const [localInterval, setLocalInterval] = useState<IntervalFilter>(filters.interval);
  const [localState, setLocalState] = useState('');

  const allStates = React.useMemo(() => {
    return State.getStatesOfCountry('IN').sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    setLocalDate(filters.date);
    setLocalInterval(filters.interval);
  }, [filters]);

  const handleSearch = () => {
    onSearch({ date: localDate, interval: localInterval }, localState);
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', pr: 2, borderRight: '1px solid', borderColor: 'divider' }}>
          <FilterIcon fontSize="small" sx={{ color: accentColor }} />
          <Box component="span" sx={{ fontSize: '13px', fontWeight: 600 }}>Filters</Box>
        </Box>
        
        <TextField
          type="date"
          size="small"
          value={localDate}
          onChange={(e) => setLocalDate(e.target.value)}
          sx={{ 
            minWidth: 160, 
            '& .MuiInputBase-root': { fontSize: '13px', backgroundColor: 'background.default', borderRadius: 1.5 } 
          }}
          inputProps={{ max: '2050-12-31' }}
        />

        <TextField
          select
          size="small"
          value={localInterval}
          onChange={(e) => setLocalInterval(e.target.value as IntervalFilter)}
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

        <TextField
          select
          size="small"
          label="Select State"
          value={localState}
          onChange={(e) => setLocalState(e.target.value)}
          sx={{ 
            minWidth: 180, 
            '& .MuiInputBase-root': { fontSize: '13px', backgroundColor: 'background.default', borderRadius: 1.5 } 
          }}
        >
          <MenuItem value="" sx={{ fontSize: '13px' }}>
            <em>None</em>
          </MenuItem>
          {allStates.map((state) => (
            <MenuItem key={state.isoCode} value={state.isoCode} sx={{ fontSize: '13px' }}>
              {state.name}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          sx={{ 
            bgcolor: accentColor, 
            '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)' },
            textTransform: 'none',
            borderRadius: 1.5,
            px: 3
          }}
        >
          Search
        </Button>
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
