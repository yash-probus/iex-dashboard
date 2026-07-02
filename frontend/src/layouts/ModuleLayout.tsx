import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, alpha, useTheme, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MARKET_ITEMS, DATABASE_ITEMS, RESOURCE_CENTER_ITEMS, OverviewItemConfig } from '../constants/dashboardOverview';

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
    activeModuleTitle = 'Database Analytics';
    activeModuleColor = '#9C27B0';
  } else if (location.pathname.startsWith('/dam') || location.pathname.startsWith('/gdam') || location.pathname.startsWith('/rtm') || location.pathname.startsWith('/markets')) {
    activeItems = MARKET_ITEMS;
    activeModuleTitle = 'IEX Market';
    activeModuleColor = '#00BFA5';
  } else if (location.pathname.startsWith('/resource-center')) {
    activeItems = RESOURCE_CENTER_ITEMS;
    activeModuleTitle = 'Resource Center';
    activeModuleColor = '#03A9F4';
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

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, 
      gap: 3, 
      flexGrow: 1 
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
                      color: buttonSelected ? activeModuleColor : 'text.secondary'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.title} 
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        fontWeight: buttonSelected ? 600 : 500,
                        color: buttonSelected ? 'text.primary' : 'text.secondary'
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
                                '&.Mui-selected': {
                                  bgcolor: 'transparent',
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: -2,
                                    top: 0,
                                    bottom: 0,
                                    width: 2,
                                    backgroundColor: activeModuleColor
                                  }
                                }
                              }}
                            >
                              {sub.icon && (
                                <ListItemIcon sx={{ minWidth: 32, color: isSubActive ? activeModuleColor : 'text.secondary' }}>
                                  {sub.icon}
                                </ListItemIcon>
                              )}
                              <ListItemText 
                                primary={sub.title} 
                                primaryTypographyProps={{
                                  variant: 'caption',
                                  fontWeight: isSubActive ? 600 : 500,
                                  color: isSubActive ? activeModuleColor : 'text.secondary'
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
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
