import React from 'react';
import { Box, Typography, Grid, Button, Paper, alpha, useTheme } from '@mui/material';
import {
  BarChart as ChartIcon,
  Storage as StorageIcon,
  SettingsSuggest as SettingsIcon,
  Calculate as CalculateIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  OpenInNew as OpenInNewIcon,
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
    key: 'custom-saving-calc',
    title: 'Custom Savings Calculator',
    description: 'Calculate Open Access savings with custom TOD start/end timings and direct effective Discom prices.',
    path: '/custom-saving-calc',
    icon: <CalculateIcon sx={{ fontSize: 24 }} />,
    color: '#EC4899'
  },
  {
    key: 'savings-calculator-new',
    title: 'Savings Calculator (New)',
    description: 'Calculate Open Access savings with state utility tariffs (New layout).',
    path: '/savings-calculator-new',
    icon: <CalculateIcon sx={{ fontSize: 24 }} />,
    color: '#3B82F6'
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
  },
  {
    key: 'customer-lead',
    title: 'Customer Lead',
    description: 'Track and manage new customer leads and inquiries.',
    path: '/customer-lead',
    icon: <GroupIcon sx={{ fontSize: 24 }} />,
    color: '#F59E0B'
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
      pb: 2,
      px: { xs: 0, sm: 2 }
    }}>
      <Box sx={{ mb: 4, pt: { xs: 1, md: 2 } }}>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1, fontSize: '1.15rem', fontWeight: 500 }}>
          Welcome back, <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{displayName}</Box>
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: 1.5, letterSpacing: '-0.5px' }}>
          Select Module
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
          Choose a module to access its features and functionality
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {MODULES.filter(mod => !(user as any)?.hiddenModules?.includes(mod.key)).map((mod) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={mod.key}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRadius: 3,
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
              <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                {/* Icon Container */}
                <Box sx={{ 
                  color: mod.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 48, 
                  height: 48, 
                  bgcolor: alpha(mod.color, 0.1), 
                  borderRadius: '50%', 
                  flexShrink: 0,
                  mr: 2
                }}>
                  {React.cloneElement(mod.icon, { sx: { fontSize: 24 } })}
                </Box>
                
                {/* Text and Action Container */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0A1128', fontSize: '1.15rem', letterSpacing: '-0.3px', textAlign: 'left', lineHeight: 1.2 }}>
                      {mod.title}
                    </Typography>
                    <OpenInNewIcon sx={{ fontSize: 20, color: 'text.secondary', opacity: 0.6 }} />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#4A5568', lineHeight: 1.5, fontSize: '0.95rem', textAlign: 'left' }}>
                    {mod.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
