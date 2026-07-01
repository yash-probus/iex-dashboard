import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, alpha, useTheme } from '@mui/material';
import { MARKET_ITEMS, DATABASE_ITEMS, RESOURCE_CENTER_ITEMS } from '../constants/dashboardOverview';

export default function ModuleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  let activeItems = [];
  let activeModuleTitle = '';
  let activeModuleColor = theme.palette.primary.main;

  if (location.pathname.startsWith('/database')) {
    activeItems = DATABASE_ITEMS;
    activeModuleTitle = 'Database Analytics';
    activeModuleColor = '#9C27B0';
  } else if (location.pathname.startsWith('/dam') || location.pathname.startsWith('/gdam') || location.pathname.startsWith('/rtm') || location.pathname.startsWith('/markets')) {
    activeItems = MARKET_ITEMS;
    activeModuleTitle = 'Market Intelligence';
    activeModuleColor = '#00BFA5';
  } else if (location.pathname.startsWith('/resource-center')) {
    activeItems = RESOURCE_CENTER_ITEMS;
    activeModuleTitle = 'Resource Center';
    activeModuleColor = '#03A9F4';
  }

  return (
    <Box sx={{ display: 'flex', gap: 3, flexGrow: 1 }}>
      {/* Sidebar */}
      <Paper 
        elevation={0}
        sx={{ 
          width: 280, 
          flexShrink: 0, 
          height: 'calc(100vh - 120px)',
          position: 'sticky',
          top: 88,
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: alpha(activeModuleColor, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
            Module Navigation
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: activeModuleColor }}>
            {activeModuleTitle}
          </Typography>
        </Box>

        <List sx={{ p: 1.5, flexGrow: 1, overflowY: 'auto' }}>
          {activeItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  selected={isActive}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    borderRadius: 2,
                    py: 1.2,
                    '&.Mui-selected': {
                      bgcolor: alpha(activeModuleColor, 0.1),
                      '&:hover': {
                        bgcolor: alpha(activeModuleColor, 0.15),
                      }
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40, 
                    color: isActive ? activeModuleColor : 'text.secondary'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'text.primary' : 'text.secondary'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
