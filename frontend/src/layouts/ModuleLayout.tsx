import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Box, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, alpha, useTheme, Collapse, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { ExpandLess, ExpandMore, NavigateNext } from '@mui/icons-material';
import { MARKET_ITEMS, DATABASE_ITEMS, RESOURCE_CENTER_ITEMS, MARKET_OPERATIONS_ITEMS, OverviewItemConfig, FORECAST_ITEMS } from '../constants/dashboardOverview';


export default function ModuleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // State to manage expanded lists
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  let activeItems: OverviewItemConfig[] = [];
  let activeModuleTitle = '';
  let activeModuleColor = theme.palette.primary.main;

  if (location.pathname.startsWith('/database')) {
    activeItems = DATABASE_ITEMS;
    activeModuleTitle = 'Demand & Generation Data';
    activeModuleColor = theme.palette.primary.main;
  } else if (location.pathname.startsWith('/forecast')) {
    activeItems = FORECAST_ITEMS;
    activeModuleTitle = 'Forecast Analytics';
    activeModuleColor = '#8B5CF6';
  } else if (location.pathname.startsWith('/dam') || location.pathname.startsWith('/gdam') || location.pathname.startsWith('/rtm') || location.pathname.startsWith('/rec') || location.pathname.startsWith('/markets')) {
    activeItems = MARKET_ITEMS;
    activeModuleTitle = 'IEX Market';
    activeModuleColor = '#00BFA5';
  } else if (location.pathname.startsWith('/resource-center')) {
    activeItems = RESOURCE_CENTER_ITEMS;
    activeModuleTitle = 'Resource Center';
    activeModuleColor = '#03A9F4';
  } else if (location.pathname.startsWith('/market-operations')) {
    activeItems = MARKET_OPERATIONS_ITEMS;
    activeModuleTitle = 'Market Trend';
    activeModuleColor = '#FF7043';
  }

  // Automatically open parent if a child is active
  useEffect(() => {
    const newOpenStates = { ...openStates };
    let stateChanged = false;
    
    activeItems.forEach(item => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some((sub: any) => location.pathname.includes(sub.path));
        if (hasActiveChild && !openStates[item.key]) {
          newOpenStates[item.key] = true;
          stateChanged = true;
        }
      }
    });
    
    if (stateChanged) setOpenStates(newOpenStates);
  }, [location.pathname, activeItems]);

  const handleToggle = (key: string, defaultPath?: string) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
    if (defaultPath) {
      navigate(defaultPath);
    }
  };

  // Find active titles for breadcrumbs
  let parentTitle = '';
  let childTitle = '';
  let parentPath = '';
  
  activeItems.forEach(item => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    if (hasSubItems) {
      item.subItems.forEach((sub: any) => {
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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, 
      gap: 3, 
      flexGrow: 1,
      minHeight: { xs: 'auto', md: 'calc(100vh - 120px)' },
      pt: { xs: 2, md: 3 }
    }}>
      {/* Sidebar */}
      <Paper 
        elevation={0}
        sx={{ 
          width: { xs: '100%', md: 280 }, 
          flexShrink: 0, 
          height: { xs: 'auto', md: 'calc(100vh - 120px)' },
          position: { xs: 'relative', md: 'sticky' },
          top: { xs: 0, md: 88 },
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >


        <List sx={{ p: 1.5, flexGrow: 1, overflowY: 'auto' }}>
          {activeItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            // Check if current route is the parent path (only if it doesn't have subItems, otherwise we check children)
            const isActive = !hasSubItems && location.pathname.includes(item.path);
            const isOpen = openStates[item.key] || false;
            
            // Check if ANY child is active for parent styling
            const isParentActive = hasSubItems && item.subItems!.some((sub: any) => location.pathname.includes(sub.path));
            const buttonSelected = isActive || isParentActive;

            return (
              <React.Fragment key={item.key}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      selected={buttonSelected}
                      onClick={() => hasSubItems ? handleToggle(item.key) : navigate(item.path)}
                      sx={{ 
                        borderRadius: 2,
                        py: 1.2,
                        color: buttonSelected ? activeModuleColor : 'text.secondary',
                        '&.Mui-selected': {
                          bgcolor: alpha(activeModuleColor, 0.1),
                          color: activeModuleColor,
                          '&:hover': {
                            bgcolor: alpha(activeModuleColor, 0.15),
                          }
                        },
                        '&:hover': {
                          backgroundColor: '#1E293B !important',
                          color: '#FFFFFF !important',
                          '& .MuiListItemIcon-root, & .MuiListItemText-primary, & .MuiSvgIcon-root, & .MuiTypography-root': {
                            color: '#FFFFFF !important',
                          }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40, 
                        color: 'inherit',
                        transition: 'color 0.2s ease-in-out'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          fontWeight: buttonSelected ? 600 : 500,
                          color: 'inherit',
                          sx: { transition: 'color 0.2s ease-in-out' }
                        }} 
                      />
                    {hasSubItems && (
                      isOpen ? <ExpandLess sx={{ color: buttonSelected ? activeModuleColor : 'text.secondary' }} /> : <ExpandMore sx={{ color: buttonSelected ? activeModuleColor : 'text.secondary' }} />
                    )}
                  </ListItemButton>
                </ListItem>

                {hasSubItems && (
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ ml: 4, mb: 1, borderLeft: `2px solid ${alpha(activeModuleColor, 0.2)}` }}>
                      {item.subItems!.map((sub: any) => {
                        const isSubActive = location.pathname.includes(sub.path);
                        return (
                          <ListItem key={sub.key} disablePadding sx={{ mt: 0.5 }}>
                              <ListItemButton
                                selected={isSubActive}
                                onClick={() => navigate(sub.path)}
                                sx={{
                                  borderRadius: '0 8px 8px 0',
                                  py: 1,
                                  color: isSubActive ? activeModuleColor : 'text.secondary',
                                  '&.Mui-selected': {
                                    bgcolor: 'transparent',
                                    position: 'relative',
                                    color: activeModuleColor,
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      left: -2,
                                      top: 0,
                                      bottom: 0,
                                      width: 2,
                                      backgroundColor: activeModuleColor
                                    }
                                  },
                                  '&:hover': {
                                    backgroundColor: '#1E293B !important',
                                    borderRadius: 2,
                                    color: '#FFFFFF !important',
                                    '& .MuiListItemIcon-root, & .MuiListItemText-primary, & .MuiSvgIcon-root, & .MuiTypography-root': {
                                      color: '#FFFFFF !important',
                                    }
                                  }
                                }}
                              >
                                {sub.icon && (
                                  <ListItemIcon sx={{ 
                                    minWidth: 32, 
                                    color: 'inherit',
                                    transition: 'color 0.2s ease-in-out'
                                  }}>
                                    {sub.icon}
                                  </ListItemIcon>
                                )}
                                <ListItemText 
                                  primary={sub.title} 
                                  primaryTypographyProps={{
                                    variant: 'caption',
                                    fontWeight: isSubActive ? 600 : 500,
                                    color: 'inherit',
                                    sx: { transition: 'color 0.2s ease-in-out' }
                                  }}
                                />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>

      {/* Main Content */}
      <Box id="module-content-wrapper" sx={{ flexGrow: 1, minWidth: 0 }}>
        {parentTitle && (
          <Breadcrumbs 
            separator={<NavigateNext fontSize="small" />} 
            aria-label="breadcrumb"
            sx={{ mb: 3 }}
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
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
