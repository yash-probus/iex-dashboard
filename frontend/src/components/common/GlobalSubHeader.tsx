import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { NavigateNext } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { MARKET_ITEMS, DATABASE_ITEMS, RESOURCE_CENTER_ITEMS, MARKET_OPERATIONS_ITEMS, FORECAST_ITEMS } from '../../constants/dashboardOverview';

export default function GlobalSubHeader() {
  const location = useLocation();
  const { user } = useAuth();
  
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const displayName = user && (user as any).name ? (user as any).name : 'User';

  if (isDashboard) {
    return null;
  }

  let activeItems: any[] = [];
  let activeModuleTitle = '';

  if (location.pathname.startsWith('/database')) {
    activeItems = DATABASE_ITEMS;
    activeModuleTitle = 'Demand & Generation Data';
  } else if (location.pathname.startsWith('/forecast')) {
    activeItems = FORECAST_ITEMS;
    activeModuleTitle = 'Forecast Analytics';
  } else if (location.pathname.startsWith('/dam') || location.pathname.startsWith('/gdam') || location.pathname.startsWith('/rtm') || location.pathname.startsWith('/rec') || location.pathname.startsWith('/markets')) {
    activeItems = MARKET_ITEMS;
    activeModuleTitle = 'IEX Market';
  } else if (location.pathname.startsWith('/resource-center')) {
    activeItems = RESOURCE_CENTER_ITEMS;
    activeModuleTitle = 'Resource Center';
  } else if (location.pathname.startsWith('/market-operations')) {
    activeItems = MARKET_OPERATIONS_ITEMS;
    activeModuleTitle = 'Market Trend';
  }

  let parentTitle = '';
  let childTitle = '';
  
  activeItems.forEach(item => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    if (hasSubItems) {
      item.subItems?.forEach((sub: any) => {
        if (location.pathname.includes(sub.path)) {
          parentTitle = item.title;
          childTitle = sub.title;
        }
      });
    } else {
      if (location.pathname.includes(item.path)) {
        parentTitle = item.title;
      }
    }
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
      {parentTitle ? (
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          aria-label="breadcrumb"
        >
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="inherit">
            {activeModuleTitle}
          </Typography>
          {childTitle ? (
            <Typography color="inherit">
              {parentTitle}
            </Typography>
          ) : (
            <Typography color="text.primary" fontWeight={600}>
              {parentTitle}
            </Typography>
          )}
          {childTitle && (
            <Typography color="text.primary" fontWeight={600}>
              {childTitle}
            </Typography>
          )}
        </Breadcrumbs>
      ) : (
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          aria-label="breadcrumb"
        >
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary" fontWeight={600}>
            {activeModuleTitle || 'Admin'}
          </Typography>
        </Breadcrumbs>
      )}
    </Box>
  );
}
