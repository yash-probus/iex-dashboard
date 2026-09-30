import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Bolt as BoltIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function TraderPerformanceDailyPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');

  // Sample placeholder summary KPI metrics for Daily Trader Performance
  const dailyKpis = [
    {
      title: 'Total Volume Traded',
      value: '142.50 MWh',
      subtext: 'Across DAM & RTM',
      color: '#2E51FF',
      icon: <BoltIcon sx={{ fontSize: 24 }} />
    },
    {
      title: 'Avg. Cleared Price',
      value: '₹ 4.82 / kWh',
      subtext: '-₹0.38 vs MCP baseline',
      color: '#10B981',
      icon: <CurrencyRupeeIcon sx={{ fontSize: 24 }} />
    },
    {
      title: 'Daily Gross Savings',
      value: '₹ 54,150',
      subtext: 'Calculated against Discom tariff',
      color: '#F59E0B',
      icon: <TrendingUpIcon sx={{ fontSize: 24 }} />
    },
    {
      title: 'Execution Accuracy',
      value: '99.2%',
      subtext: '95 of 96 blocks cleared',
      color: '#8B5CF6',
      icon: <AssessmentIcon sx={{ fontSize: 24 }} />
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Top Banner / Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h1" sx={{ fontSize: '1.4rem', fontWeight: 700, color: 'text.primary' }}>
                Trader Performance Daily
              </Typography>
              <Chip
                label="Daily Module"
                size="small"
                sx={{
                  bgcolor: alpha('#F59E0B', 0.12),
                  color: '#D97706',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Monitor day-by-day power trading volumes, clearance rates, price arbitrage, and daily client cost savings.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { borderColor: 'text.secondary' }
            }}
          >
            Export Daily Report
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Sync Data
          </Button>
        </Box>
      </Box>

      {/* Filter / Selection Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
          <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Filters:
          </Typography>
        </Box>

        <TextField
          type="date"
          label="Trading Date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        />

        <TextField
          select
          label="Market Segment"
          size="small"
          value={selectedMarket}
          onChange={(e) => setSelectedMarket(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Segments</MenuItem>
          <MenuItem value="DAM">Day Ahead Market (DAM)</MenuItem>
          <MenuItem value="GDAM">Green DAM (GDAM)</MenuItem>
          <MenuItem value="RTM">Real Time Market (RTM)</MenuItem>
        </TextField>

        <TextField
          select
          label="Client / Entity"
          size="small"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="ALL">All Clients</MenuItem>
        </TextField>
      </Paper>

      {/* Daily KPI Metrics */}
      <Grid container spacing={2}>
        {dailyKpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: alpha(kpi.color, 0.1),
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {kpi.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                  {kpi.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', my: 0.2 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {kpi.subtext}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Daily Trading Interval Breakdown Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Daily Interval Breakdown (96 Time Blocks)
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              15-minute slot performance for {selectedDate}
            </Typography>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Block #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time Slot</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Market</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Bid Volume (MW)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Cleared Volume (MW)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Bid Price (₹/kWh)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>MCP (₹/kWh)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell>1</TableCell>
                <TableCell>00:00 - 00:15</TableCell>
                <TableCell>DAM</TableCell>
                <TableCell align="right">2.50</TableCell>
                <TableCell align="right">2.50</TableCell>
                <TableCell align="right">₹ 4.50</TableCell>
                <TableCell align="right">₹ 4.12</TableCell>
                <TableCell align="center">
                  <Chip label="Cleared" size="small" color="success" sx={{ height: 22, fontSize: '0.75rem' }} />
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>2</TableCell>
                <TableCell>00:15 - 00:30</TableCell>
                <TableCell>DAM</TableCell>
                <TableCell align="right">2.50</TableCell>
                <TableCell align="right">2.50</TableCell>
                <TableCell align="right">₹ 4.50</TableCell>
                <TableCell align="right">₹ 4.15</TableCell>
                <TableCell align="center">
                  <Chip label="Cleared" size="small" color="success" sx={{ height: 22, fontSize: '0.75rem' }} />
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>3</TableCell>
                <TableCell>00:30 - 00:45</TableCell>
                <TableCell>DAM</TableCell>
                <TableCell align="right">2.50</TableCell>
                <TableCell align="right">2.50</TableCell>
                <TableCell align="right">₹ 4.50</TableCell>
                <TableCell align="right">₹ 4.08</TableCell>
                <TableCell align="center">
                  <Chip label="Cleared" size="small" color="success" sx={{ height: 22, fontSize: '0.75rem' }} />
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>4</TableCell>
                <TableCell>00:45 - 01:00</TableCell>
                <TableCell>RTM</TableCell>
                <TableCell align="right">1.20</TableCell>
                <TableCell align="right">1.20</TableCell>
                <TableCell align="right">₹ 4.20</TableCell>
                <TableCell align="right">₹ 3.95</TableCell>
                <TableCell align="center">
                  <Chip label="Cleared" size="small" color="success" sx={{ height: 22, fontSize: '0.75rem' }} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
