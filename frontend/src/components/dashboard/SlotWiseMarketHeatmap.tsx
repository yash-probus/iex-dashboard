import React, { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip, useTheme } from '@mui/material';

interface SlotData {
  date: string;
  timeblock: number;
  marketSource: string;
  shouldBuyFromMarket: boolean;
  marketEnergy?: number;
  discomEnergy?: number;
}

interface SlotWiseMarketHeatmapProps {
  slotsData: SlotData[];
}

export const SlotWiseMarketHeatmap: React.FC<SlotWiseMarketHeatmapProps> = ({ slotsData }) => {
  const theme = useTheme();

  // Find the maximum energy value across all slots to scale opacity
  const maxEnergy = useMemo(() => {
    let max = 0;
    slotsData?.forEach((slot) => {
      const volume = slot.shouldBuyFromMarket ? (slot.marketEnergy || 0) : (slot.discomEnergy || 0);
      if (volume > max) max = volume;
    });
    return max > 0 ? max : 1;
  }, [slotsData]);

  // Group data by timeblock (Y-axis) and then date (X-axis)
  const { heatmapData, dates } = useMemo(() => {
    if (!slotsData || slotsData.length === 0) return { heatmapData: [], dates: [] };

    // Get unique sorted dates
    const uniqueDates = Array.from(new Set(slotsData.map(s => s.date))).sort((a, b) => a.localeCompare(b));
    
    // Initialize 96 rows
    const grouped: Record<number, Record<string, SlotData | null>> = {};
    for (let i = 1; i <= 96; i++) {
      grouped[i] = {};
      uniqueDates.forEach(date => {
        grouped[i][date] = null;
      });
    }

    // Populate data
    slotsData.forEach((slot) => {
      if (slot.timeblock >= 1 && slot.timeblock <= 96) {
        grouped[slot.timeblock][slot.date] = slot;
      }
    });

    return { heatmapData: grouped, dates: uniqueDates };
  }, [slotsData]);

  if (dates.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">No data available to display heatmap.</Typography>
      </Box>
    );
  }

  const getCellColor = (slot: SlotData | null) => {
    if (!slot) return 'rgba(241, 245, 249, 1)'; // Missing data (#f1f5f9)
    
    // Dynamic opacity based on volume
    const volume = slot.shouldBuyFromMarket ? (slot.marketEnergy || 0) : (slot.discomEnergy || 0);
    let opacity = volume > 0 ? 0.2 + (0.8 * (volume / maxEnergy)) : 0.1;
    if (opacity > 1) opacity = 1;

    if (!slot.shouldBuyFromMarket) return `rgba(148, 163, 184, ${opacity})`; // DISCOM (Gray)
    if (slot.marketSource === 'DAM') return `rgba(245, 158, 11, ${opacity})`; // DAM (Amber - matches screenshot)
    if (slot.marketSource === 'GDAM') return `rgba(16, 185, 129, ${opacity})`; // GDAM (Green)
    if (slot.marketSource === 'RTM') return `rgba(225, 112, 125, ${opacity})`; // RTM (Reddish/Pink - matches screenshot)
    
    return `rgba(226, 232, 240, 1)`;
  };

  const getTooltipContent = (slot: SlotData | null) => {
    if (!slot) return 'No data';
    const source = slot.shouldBuyFromMarket ? slot.marketSource : 'DISCOM';
    const volume = slot.shouldBuyFromMarket ? slot.marketEnergy : slot.discomEnergy;
    
    const startMinutes = (slot.timeblock - 1) * 15;
    const hour = Math.floor(startMinutes / 60);
    const min = startMinutes % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{slot.date} at {timeStr}</Typography>
        <Typography variant="body2">Source: {source}</Typography>
        <Typography variant="body2">Volume: {volume ? volume.toFixed(2) : 0} kWh</Typography>
      </Box>
    );
  };

  const formattedDates = dates.map(dateStr => {
    const dateObj = new Date(dateStr);
    return `${dateObj.getDate()}-${dateObj.toLocaleString('default', { month: 'short' })}`;
  });

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflowX: 'auto', backgroundColor: '#fff' }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Blockwise market activity heatmap
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {dates.length} days x 96 time blocks. Hover any colored cell for market, quantity and rate.
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#F59E0B', borderRadius: 0.5 }} />
          <Typography variant="caption" fontWeight={600}>DAM</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#10B981', borderRadius: 0.5 }} />
          <Typography variant="caption" fontWeight={600}>GDAM</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#E1707D', borderRadius: 0.5 }} />
          <Typography variant="caption" fontWeight={600}>RTM</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#F1F5F9', borderRadius: 0.5, border: '1px solid #E2E8F0' }} />
          <Typography variant="caption" fontWeight={600}>Light cell = zero scheduled quantity</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* X-axis labels (Dates) */}
        <Box sx={{ display: 'flex', ml: '60px', mb: 1, gap: '2px' }}>
          {formattedDates.map((label, i) => (
            <Box key={i} sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  transform: 'rotate(-60deg)',
                  transformOrigin: 'bottom left',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  fontSize: '10px'
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Heatmap Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {Array.from({ length: 96 }).map((_, rowIndex) => {
            const timeblock = rowIndex + 1;
            const rowData = heatmapData[timeblock];
            
            // Generate label every 4 timeblocks (1 hour)
            let timeLabel = '';
            if (rowIndex % 4 === 0) {
              const hour = Math.floor((rowIndex * 15) / 60);
              timeLabel = `${String(hour).padStart(2, '0')}:00`;
            }

            return (
              <Box key={timeblock} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '60px', flexShrink: 0, textAlign: 'right', pr: 2, height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {timeLabel && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '10px' }}>
                      {timeLabel}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: '2px', flex: 1 }}>
                  {dates.map((dateStr) => {
                    const slot = rowData[dateStr];
                    return (
                      <Tooltip key={dateStr} title={getTooltipContent(slot)} arrow placement="top">
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            height: '10px',
                            bgcolor: getCellColor(slot),
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.2) inset'
                            }
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};
