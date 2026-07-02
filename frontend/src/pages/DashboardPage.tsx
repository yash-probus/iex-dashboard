import React from 'react';
import { Box, Typography, Grid, Button, Paper, alpha, useTheme } from '@mui/material';
import { 
  BarChart as ChartIcon, 
  Storage as StorageIcon, 
  SettingsSuggest as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MODULES = [
  {
    key: 'database',
    title: 'Database Analytics',
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
    key: 'api-logs',
    title: 'API Logs',
    description: 'Monitor background operations and check API health logs (NPP, Weather, etc).',
    path: '/admin/api-logs',
    icon: <StorageIcon sx={{ fontSize: 24 }} />,
    color: '#10B981'
  },
  {
    key: 'market-operations',
    title: 'Market Operations',
    description: 'Compare and upload MCP data across DAM, RTM, and GDAM.',
    path: '/markets/operations',
    icon: <SettingsIcon sx={{ fontSize: 24 }} />,
    color: '#FF7043'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const theme = useTheme();
  
  // Fallback if admin.name isn't available
  const displayName = admin && (admin as any).name ? (admin as any).name : 'Admin User';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      py: 2,
    }}>
      <Box sx={{ mb: 4, pt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.9rem' }}>
          Welcome back, <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{displayName}</Box>
        </Typography>
        <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 700, mb: 1, fontSize: '1.5rem', letterSpacing: '0px' }}>
          Select Module
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          Choose a module to access its features and functionality
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {MODULES.map((mod) => (
          <Grid item xs={12} md={4} key={mod.key}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: theme.palette.background.paper,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: alpha(mod.color, 0.4),
                  boxShadow: `0 10px 30px -10px ${alpha(mod.color, 0.15)}`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
                <Box sx={{ color: mod.color, display: 'flex', alignItems: 'center', p: 1, bgcolor: alpha(mod.color, 0.1), borderRadius: 1.5 }}>
                  {mod.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                  {mod.title}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, flexGrow: 1, lineHeight: 1.6, fontSize: '0.9rem', mt: 1 }}>
                {mod.description}
              </Typography>

              <Button 
                fullWidth
                variant="contained"
                disableElevation
                onClick={() => navigate(mod.path)}
                sx={{ 
                  mt: 'auto',
                  py: 1.2,
                  bgcolor: theme.palette.primary.main, 
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: theme.palette.primary.main,
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
