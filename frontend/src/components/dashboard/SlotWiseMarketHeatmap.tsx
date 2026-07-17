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

  // Group data by date
  const heatmapData = useMemo(() => {
    if (!slotsData || slotsData.length === 0) return [];

    const grouped: Record<string, SlotData[]> = {};
    slotsData.forEach((slot) => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = Array(96).fill(null);
      }
      // timeblock is 1-indexed (1 to 96)
      const index = slot.timeblock - 1;
      if (index >= 0 && index < 96) {
        grouped[slot.date][index] = slot;
      }
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [slotsData]);

  if (heatmapData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">No data available to display heatmap.</Typography>
      </Box>
    );
  }

  const getCellColor = (slot: SlotData | null) => {
    if (!slot) return '#f1f5f9'; // Missing data
    if (!slot.shouldBuyFromMarket) return '#94a3b8'; // DISCOM (Gray)
    if (slot.marketSource === 'DAM') return '#3b82f6'; // DAM (Blue)
    if (slot.marketSource === 'GDAM') return '#10b981'; // GDAM (Green)
    if (slot.marketSource === 'RTM') return '#8b5cf6'; // RTM (Purple)
    return '#e2e8f0';
  };

  const getTooltipContent = (slot: SlotData | null) => {
    if (!slot) return 'No data';
    const source = slot.shouldBuyFromMarket ? slot.marketSource : 'DISCOM';
    const volume = slot.shouldBuyFromMarket ? slot.marketEnergy : slot.discomEnergy;
    
    // Calculate time from timeblock
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

  // Generate x-axis labels (every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  const xAxisLabels = [0, 16, 32, 48, 64, 80].map(tbIndex => {
    const hour = Math.floor((tbIndex * 15) / 60);
    return `${String(hour).padStart(2, '0')}:00`;
  });

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflowX: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Slot-wise Market Procurement Heatmap
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#94a3b8', borderRadius: 0.5 }} />
          <Typography variant="body2">DISCOM</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#3b82f6', borderRadius: 0.5 }} />
          <Typography variant="body2">DAM</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#10b981', borderRadius: 0.5 }} />
          <Typography variant="body2">GDAM</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#8b5cf6', borderRadius: 0.5 }} />
          <Typography variant="body2">RTM</Typography>
        </Box>
      </Box>

      <Box sx={{ minWidth: 800 }}>
        {/* X-axis labels */}
        <Box sx={{ display: 'flex', ml: '60px', mb: 1, position: 'relative' }}>
          {xAxisLabels.map((label, i) => (
            <Typography 
              key={i} 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                left: `${(i * 16) / 96 * 100}%`,
                transform: 'translateX(-50%)',
                color: 'text.secondary'
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        {/* Heatmap Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {heatmapData.map(([dateStr, slots]) => {
            const dateObj = new Date(dateStr);
            const dateLabel = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;
            
            return (
              <Box key={dateStr} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ width: '50px', textAlign: 'right', mr: '10px', color: 'text.secondary' }}>
                  {dateLabel}
                </Typography>
                <Box sx={{ display: 'flex', flex: 1, gap: '1px' }}>
                  {slots.map((slot, idx) => (
                    <Tooltip key={idx} title={getTooltipContent(slot)} arrow placement="top">
                      <Box
                        sx={{
                          flex: 1,
                          height: 12,
                          bgcolor: getCellColor(slot),
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scale(1.1)',
                            zIndex: 1,
                            boxShadow: theme.shadows[2]
                          }
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};
