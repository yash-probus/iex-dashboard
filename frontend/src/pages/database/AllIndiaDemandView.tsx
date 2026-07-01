import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Grid
} from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RawNppData {
  timeStr: string;
  demandMet: number;
  dataUpdatedAt?: string;
  fetchedAt?: string;
}

interface AdjustedNppData {
  timeStr: string;
  avgDemand: number;
  maxDemand: number;
  minDemand: number;
}

interface AllIndiaDemandViewProps {
  data: {
    raw: RawNppData[];
    adjusted: AdjustedNppData[];
  } | null;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onExport: () => void;
}

export default function AllIndiaDemandView({ 
  data, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onExport
}: AllIndiaDemandViewProps) {
  const theme = useTheme();
  const [viewType, setViewType] = useState<'raw' | 'adjusted'>('adjusted');

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'raw' | 'adjusted' | null,
  ) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  const chartData = viewType === 'raw' ? data?.raw : data?.adjusted;
  const latestSnapshot: any = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Latest Snapshot Cards */}
      <Box>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Latest Snapshot</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: alpha('#3B8FF3', 0.1), borderRadius: 3, border: '1px solid', borderColor: alpha('#3B8FF3', 0.2) }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">LATEST TIME</Typography>
                <Typography variant="h6" color="#3B8FF3">{latestSnapshot?.timeStr || '-'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: alpha('#2E51FF', 0.1), borderRadius: 3, border: '1px solid', borderColor: alpha('#2E51FF', 0.2) }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{viewType === 'raw' ? 'Demand Met (MW)' : 'Max Demand (MW)'}</Typography>
                <Typography variant="h6" color="#2E51FF">{latestSnapshot ? (viewType === 'raw' ? latestSnapshot.demandMet?.toLocaleString() : latestSnapshot.maxDemand?.toLocaleString()) : '-'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          {viewType === 'adjusted' && (
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ bgcolor: alpha('#10B981', 0.1), borderRadius: 3, border: '1px solid', borderColor: alpha('#10B981', 0.2) }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">MIN DEMAND (MW)</Typography>
                  <Typography variant="h6" color="#10B981">{latestSnapshot?.minDemand?.toLocaleString() || '-'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {viewType === 'adjusted' && (
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ bgcolor: alpha('#8B5CF6', 0.1), borderRadius: 3, border: '1px solid', borderColor: alpha('#8B5CF6', 0.2) }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">AVG DEMAND (MW)</Typography>
                  <Typography variant="h6" color="#8B5CF6">{latestSnapshot?.avgDemand?.toLocaleString() || '-'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Date Pickers removed from here as they are now adjoining the heading in the parent */}

    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha('#3B8FF3', 0.1),
                color: '#3B8FF3',
                mr: 2,
              }}
            >
              <TimelineIcon />
            </Box>
            <Typography variant="h6" fontWeight="600">
              Graph Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>

            <ToggleButtonGroup
              color="primary"
              value={viewType}
              exclusive
              onChange={handleViewChange}
              aria-label="View Type"
              size="small"
            >
              <ToggleButton value="adjusted">Adjusted (15-min)</ToggleButton>
              <ToggleButton value="raw">Raw (4-min)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {(!data || (data.raw.length === 0 && data.adjusted.length === 0)) ? (
          <Typography color="text.secondary">No NPP Data available for the selected date range.</Typography>
        ) : (
          <>
              <Box sx={{ height: 350, mb: 2, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="timeStr" 
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickMargin={10}
                      tickFormatter={(val) => val.split(' ')[1] || val}
                      minTickGap={30}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />
                    {viewType === 'raw' ? (
                      <Line 
                        type="monotone" 
                        dataKey="demandMet" 
                        name="Demand Met (MW)"
                        stroke="#3B8FF3" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    ) : (
                      <>
                        <Line type="monotone" dataKey="maxDemand" name="Max Demand" stroke="#EA580C" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="avgDemand" name="Avg Demand" stroke="#3B8FF3" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="minDemand" name="Min Demand" stroke="#10B981" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
          </>
        )}
      </CardContent>
    </Card>

    {/* Alerts History / Data Table */}
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="600">Alerts History (Data Table)</Typography>
          <button 
            onClick={onExport}
            style={{ 
              backgroundColor: '#1E293B', color: 'white', padding: '8px 16px', 
              borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            Export CSV
          </button>
        </Box>
        {(!data || (data.raw.length === 0 && data.adjusted.length === 0)) ? (
          <Typography color="text.secondary">No NPP Data available.</Typography>
        ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', maxHeight: 400, mt: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {viewType === 'raw' ? (
                        <>
                          <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Demand Met (MW)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Updated At</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Fetched At</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ fontWeight: 'bold' }}>Adjusted Time</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Avg Demand (MW)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Max Demand (MW)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Min Demand (MW)</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewType === 'raw' && data.raw.map((row, i) => (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                        <TableCell>{row.timeStr}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>{row.demandMet.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>{row.dataUpdatedAt ? new Date(row.dataUpdatedAt).toLocaleString() : '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>{row.fetchedAt ? new Date(row.fetchedAt).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {viewType === 'adjusted' && data.adjusted.map((row, i) => (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                        <TableCell>{row.timeStr}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>{row.avgDemand.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>{row.maxDemand.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>{row.minDemand.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
        )}
      </CardContent>
    </Card>

    </Box>
  );
}
