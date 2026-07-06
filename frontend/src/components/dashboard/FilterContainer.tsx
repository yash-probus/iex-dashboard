import React, { useState, useEffect } from 'react';
import { Paper, Box, Button, TextField, MenuItem } from '@mui/material';
import { FilterList as FilterIcon, FileDownload as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import { IntervalFilter, MarketFilters } from '../../hooks/useMarketFilters';
import ActionButton from '../common/ActionButton';
import DateRangePicker from '../common/DateRangePicker';
import { State } from 'country-state-city';

interface FilterContainerProps {
  accentColor?: string;
  filters: MarketFilters;
  onSearch: (filters: MarketFilters, selectedState?: string) => void;
  onManageData?: () => void;
  hideHourlyDaily?: boolean;
}

export default function FilterContainer({ 
  accentColor = 'primary.main',
  filters,
  onSearch,
  onManageData,
  hideHourlyDaily
}: FilterContainerProps) {
  const [localStartDate, setLocalStartDate] = useState(filters.startDate);
  const [localEndDate, setLocalEndDate] = useState(filters.endDate);
  const [localInterval, setLocalInterval] = useState<IntervalFilter>(filters.interval);
  const [localState, setLocalState] = useState('');

  const allStates = React.useMemo(() => {
    return State.getStatesOfCountry('IN').sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    setLocalStartDate(filters.startDate);
    setLocalEndDate(filters.endDate);
    setLocalInterval(filters.interval);
  }, [filters]);

  const handleSearch = () => {
    onSearch({ startDate: localStartDate, endDate: localEndDate, interval: localInterval }, localState);
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
        
        <DateRangePicker 
          startDate={localStartDate}
          endDate={localEndDate}
          onChange={(s, e) => {
            setLocalStartDate(s);
            setLocalEndDate(e);
          }}
        />



        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ 
            bgcolor: accentColor, 
            '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)' },
            textTransform: 'none',
            borderRadius: 1.5,
            px: 3
          }}
        >
          Submit
        </Button>
      </Box>
    </Paper>
  );
}
