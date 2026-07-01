import React from 'react';
import { Box, Typography, Grid, Paper, alpha, useTheme } from '@mui/material';
import { 
  BarChart as ChartIcon, 
  Storage as StorageIcon, 
  SettingsSuggest as SettingsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    key: 'database',
    title: 'Database',
    description: 'Access centralized repositories for nationwide and state-level power demand, plus historical weather data.',
    path: '/database',
    icon: <StorageIcon sx={{ fontSize: 40 }} />,
    color: '#34B1AA' // Teal
  },
  {
    key: 'markets',
    title: 'Markets',
    description: 'Explore Day Ahead, Green Day Ahead, and Real Time Market analytics with precise interval data.',
    path: '/markets',
    icon: <ChartIcon sx={{ fontSize: 40 }} />,
    color: '#3B8FF3' // Blue
  },
  {
    key: 'resource-center',
    title: 'Resource Center',
    description: 'Manage master configurations, tariffs, margins, and charge structures.',
    path: '/resource-center',
    icon: <SettingsIcon sx={{ fontSize: 40 }} />,
    color: '#8E24AA' // Purple
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h1" sx={{ color: 'text.primary', mb: 1 }}>
          Welcome to IEX Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
          Select a module below to begin analyzing market data, querying databases, or managing resources.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {MODULES.map((mod) => (
          <Grid item xs={12} md={4} key={mod.key}>
            <Paper
              elevation={0}
              onClick={() => navigate(mod.path)}
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(mod.color, 0.05)} 100%)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 20px 40px -10px ${alpha(mod.color, 0.2)}`,
                  borderColor: alpha(mod.color, 0.4),
                  '& .action-icon': {
                    transform: 'translateX(6px)',
                    color: mod.color,
                    opacity: 1
                  },
                  '& .module-icon': {
                    transform: 'scale(1.1)',
                    color: mod.color
                  }
                }
              }}
            >
              <Box sx={{ 
                width: 72, 
                height: 72, 
                borderRadius: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: alpha(mod.color, 0.1),
                color: alpha(mod.color, 0.8),
                mb: 3,
                transition: 'all 0.3s ease',
              }} className="module-icon">
                {mod.icon}
              </Box>

              <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                {mod.title}
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, flexGrow: 1, lineHeight: 1.6 }}>
                {mod.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Open Module
                </Typography>
                <ArrowForwardIcon 
                  className="action-icon"
                  sx={{ 
                    ml: 1, 
                    fontSize: 20, 
                    color: 'text.disabled',
                    opacity: 0.7,
                    transition: 'all 0.3s ease'
                  }} 
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
