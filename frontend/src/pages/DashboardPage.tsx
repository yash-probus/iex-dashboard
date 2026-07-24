import React from 'react';
import { Box, Typography, Grid, Button, Paper, alpha, useTheme } from '@mui/material';
import {
  BarChart as ChartIcon,
  Storage as StorageIcon,
  SettingsSuggest as SettingsIcon,
  Calculate as CalculateIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MODULES = [
  {
    key: 'database',
    title: 'Demand & Generation Data',
    description: 'Access centralized repositories for nationwide and state-level power demand, plus historical weather data.',
    path: '/database',
    icon: <StorageIcon sx={{ fontSize: 24 }} />,
    color: '#9C27B0'
  },
  {
    key: 'markets',
    title: 'IEX Market',
    description: 'Explore Day Ahead, Green Day Ahead, and Real Time Market analytics with precise interval data.',
    path: '/markets',
    icon: <ChartIcon sx={{ fontSize: 24 }} />,
    color: '#00BFA5'
  },
  {
    key: 'resource-center',
    title: 'Resource Center',
    description: 'Manage master configurations, tariffs, margins, and charge structures.',
    path: '/resource-center',
    icon: <SettingsIcon sx={{ fontSize: 24 }} />,
    color: '#03A9F4'
  },
  {
    key: 'market-operations',
    title: 'Market Operations',
    description: 'Compare and upload MCP data across DAM, RTM, and GDAM.',
    path: '/market-operations',
    icon: <SettingsIcon sx={{ fontSize: 24 }} />,
    color: '#FF7043'
  },
  {
    key: 'savings-calculator',
    title: 'Savings Calculator',
    description: 'Calculate landed cost of open access power (IEX) and compare savings against state utility tariffs.',
    path: '/savings-calculator',
    icon: <CalculateIcon sx={{ fontSize: 24 }} />,
    color: '#8B5CF6'
  },
  {
    key: 'forecast',
    title: 'Forecast Analytics',
    description: 'Forecast clearing prices for DAM, RTM, GDAM, and load curves for consumers and national grids.',
    path: '/forecast',
    icon: <TimelineIcon sx={{ fontSize: 24 }} />,
    color: '#8B5CF6'
  },
  {
    key: 'api-logs',
    title: 'API Logs',
    description: 'Monitor background operations and check API health logs (NPP, Weather, etc).',
    path: '/admin/api-logs',
    icon: <StorageIcon sx={{ fontSize: 24 }} />,
    color: '#10B981'
  },
  {
    key: 'user-management',
    title: 'User Management',
    description: 'Manage users, assign roles, and control access permissions.',
    path: '/admin/users',
    icon: <GroupIcon sx={{ fontSize: 24 }} />,
    color: '#3B82F6'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // Fallback if user.name isn't available
  const displayName = user && (user as any).name ? (user as any).name : 'User';

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      pb: 4,
      px: { xs: 0, sm: 2 }
    }}>
      <Box sx={{ mb: 8, pt: { xs: 2, md: 4 } }}>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, fontSize: '1.15rem', fontWeight: 500 }}>
          Welcome back, <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{displayName}</Box>
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: 1.5, letterSpacing: '-0.5px' }}>
          Select Module
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
          Choose a module to access its features and functionality
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {MODULES.filter(mod => !(user as any)?.hiddenModules?.includes(mod.key)).map((mod) => (
          <Grid item xs={12} sm={6} md={4} key={mod.key}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: theme.palette.background.paper,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: alpha(mod.color, 0.4),
                  boxShadow: `0 12px 40px -10px ${alpha(mod.color, 0.2)}`,
                  transform: 'translateY(-4px)'
                }
              }}
              onClick={() => navigate(mod.path)}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', mb: 2, gap: 2 }}>
                <Box sx={{ color: mod.color, display: 'flex', alignItems: 'center', p: 2, bgcolor: alpha(mod.color, 0.1), borderRadius: 2 }}>
                  {mod.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.25rem', letterSpacing: '-0.5px', textAlign: 'left', lineHeight: 1.2 }}>
                  {mod.title}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, flexGrow: 1, lineHeight: 1.6, fontSize: '0.9rem', textAlign: 'left', width: '100%' }}>
                {mod.description}
              </Typography>

              <Button
                fullWidth
                variant="contained"
                disableElevation
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(mod.path);
                }}
                sx={{
                  mt: 'auto',
                  py: 1.2,
                  bgcolor: alpha(mod.color, 0.1),
                  color: mod.color,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  fontSize: '0.9rem',
                  border: '1px solid',
                  borderColor: alpha(mod.color, 0.1),
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: mod.color,
                    color: '#FFF',
                  }
                }}
              >
                Access Module
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
