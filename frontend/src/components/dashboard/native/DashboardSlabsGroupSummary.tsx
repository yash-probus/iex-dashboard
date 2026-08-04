import React from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Grid } from '@mui/material';

interface DashboardSlabsGroupSummaryProps {
  calcResult: any;
}

export const DashboardSlabsGroupSummary: React.FC<DashboardSlabsGroupSummaryProps> = ({ calcResult }) => {
  if (!calcResult || !calcResult.todGroups) return null;

  return (
    <Grid container spacing={2}>
      {Object.entries(calcResult.todGroups).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, list]: any) => {
        return (
          <Grid item xs={12} sm={6} md={6} lg={6} key={groupName}>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 1.5, height: '100%', bgcolor: 'background.paper' }}>
              <Typography variant="h4" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <span>{groupName}</span>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {list.length} slots
                </Typography>
              </Typography>
              
              <Box sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#F8FAFC' }}>Date/Time</TableCell>
                      <TableCell align="right" sx={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#F8FAFC' }}>Lowest Price</TableCell>
                      <TableCell align="right" sx={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#F8FAFC' }}>DISCOM</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {list.slice(0, 50).map((row: any, idx: number) => (
                      <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                        <TableCell sx={{ fontSize: '11px', py: 0.75 }}>
                          {row.date.substring(5)} {row.timeStr}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 600, color: '#16A34A', py: 0.75 }}>
                          ₹{row.comparedLowestPrice.toFixed(2)}
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: row.selectedSource === 'DISCOM' ? '#64748B' : '#7C3AED',
                            backgroundColor: row.selectedSource === 'DISCOM' ? '#F1F5F9' : '#F5F3FF',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            marginLeft: '4px'
                          }}>
                            {row.selectedSource}
                          </span>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '11px', color: 'text.secondary', py: 0.75 }}>
                          ₹{row.discomLandingPrice.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};
