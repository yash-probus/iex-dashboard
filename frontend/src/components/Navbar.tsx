import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemText, useTheme, useMediaQuery, alpha,
  Collapse, Paper, Container, Grid
} from '@mui/material';
import {
  Login as LoginIcon, Settings as SettingsIcon, Menu as MenuIcon, Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon, ExpandLess, ExpandMore,
  BarChart, ElectricBolt, Timer as TimerIcon, Map as MapIcon,
  Business as BusinessIcon, EvStation as EvStationIcon, Receipt as ReceiptIcon,
  ShowChart as ShowChartIcon, AccountTree as AccountTreeIcon, DeviceHub as DeviceHubIcon,
  PriceCheck as PriceCheckIcon, Timeline as TimelineIcon, Cloud as CloudIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const MARKET_ITEMS = [
  { label: 'DAM', path: '/dam', icon: <BarChart fontSize="small" sx={{ color: '#3B8FF3' }} /> },
  { label: 'GDAM', path: '/gdam', icon: <ElectricBolt fontSize="small" sx={{ color: '#34B1AA' }} /> },
  { label: 'RTM', path: '/rtm', icon: <TimerIcon fontSize="small" sx={{ color: '#E0B50F' }} /> },
];

const RESOURCE_ROUTES = [
  { label: 'Region State', path: '/resource-center/region-state', icon: <MapIcon fontSize="small" sx={{ color: '#F29F67' }} /> },
  { label: 'Discom List', path: '/resource-center/discom-list', icon: <BusinessIcon fontSize="small" sx={{ color: '#3B8FF3' }} /> },
  { label: 'ISTS Charges', path: '/resource-center/ists-charges', icon: <EvStationIcon fontSize="small" sx={{ color: '#34B1AA' }} /> },
  { label: 'IEX Fees', path: '/resource-center/iex-fees', icon: <ReceiptIcon fontSize="small" sx={{ color: '#E0B50F' }} /> },
  { label: 'Prolt Margin', path: '/resource-center/prolt-margin', icon: <ShowChartIcon fontSize="small" sx={{ color: '#8B5CF6' }} /> },
  { label: 'CTU Charges', path: '/resource-center/ctu-charges', icon: <AccountTreeIcon fontSize="small" sx={{ color: '#EC4899' }} /> },
  { label: 'STU Charges', path: '/resource-center/stu-charges', icon: <DeviceHubIcon fontSize="small" sx={{ color: '#10B981' }} /> },
  { label: 'State Tariff', path: '/resource-center/state-tariff', icon: <PriceCheckIcon fontSize="small" sx={{ color: '#EF4444' }} /> },
];

const RESOURCE_GROUPS = [
  {
    title: 'Grid & Utility',
    items: [
      { label: 'Region State', path: '/resource-center/region-state', icon: <MapIcon fontSize="small" sx={{ color: '#F29F67' }} /> },
      { label: 'Discom List', path: '/resource-center/discom-list', icon: <BusinessIcon fontSize="small" sx={{ color: '#3B8FF3' }} /> },
    ]
  },
  {
    title: 'Transmission Charges',
    items: [
      { label: 'ISTS Charges', path: '/resource-center/ists-charges', icon: <EvStationIcon fontSize="small" sx={{ color: '#34B1AA' }} /> },
      { label: 'CTU Charges', path: '/resource-center/ctu-charges', icon: <AccountTreeIcon fontSize="small" sx={{ color: '#EC4899' }} /> },
    ]
  },
  {
    title: 'Utility Charges',
    items: [
      { label: 'STU Charges', path: '/resource-center/stu-charges', icon: <DeviceHubIcon fontSize="small" sx={{ color: '#10B981' }} /> },
      { label: 'State Tariff', path: '/resource-center/state-tariff', icon: <PriceCheckIcon fontSize="small" sx={{ color: '#EF4444' }} /> },
    ]
  },
  {
    title: 'Exchange & Margins',
    items: [
      { label: 'IEX Fees', path: '/resource-center/iex-fees', icon: <ReceiptIcon fontSize="small" sx={{ color: '#E0B50F' }} /> },
      { label: 'Prolt Margin', path: '/resource-center/prolt-margin', icon: <ShowChartIcon fontSize="small" sx={{ color: '#8B5CF6' }} /> },
    ]
  }
];

const DATABASE_ROUTES = [
  { label: 'All India Demand (NPP)', path: '/database/all-india-demand', icon: <TimelineIcon fontSize="small" sx={{ color: '#3B8FF3' }} /> },
  { label: 'State Wise Demand (Vidyut Pravah & IEX)', path: '/database/state-wise-demand', icon: <MapIcon fontSize="small" sx={{ color: '#34B1AA' }} /> },
  { label: 'Weather Data (Open-Meteo)', path: '/database/weather', icon: <CloudIcon fontSize="small" sx={{ color: '#E0B50F' }} /> },
  { label: 'Holiday Calendar', path: '/database/holiday-calendar', icon: <CalendarIcon fontSize="small" sx={{ color: '#E91E63' }} /> },
];


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:767px)');

  const [scrolled, setScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [desktopMarketsOpen, setDesktopMarketsOpen] = useState(false);
  const [mobileMarketsOpen, setMobileMarketsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [desktopResourceOpen, setDesktopResourceOpen] = useState(false);
  const [mobileResourceOpen, setMobileResourceOpen] = useState(false);
  const resourceDropdownRef = useRef<HTMLDivElement>(null);

  const [desktopDatabaseOpen, setDesktopDatabaseOpen] = useState(false);
  const [mobileDatabaseOpen, setMobileDatabaseOpen] = useState(false);
  const databaseDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDesktopMarketsOpen(false);
      }
      if (resourceDropdownRef.current && !resourceDropdownRef.current.contains(event.target as Node)) {
        setDesktopResourceOpen(false);
      }
      if (databaseDropdownRef.current && !databaseDropdownRef.current.contains(event.target as Node)) {
        setDesktopDatabaseOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isMarketsActive = MARKET_ITEMS.some(item => location.pathname.startsWith(item.path));
  const isResourceActive = RESOURCE_ROUTES.some(item => location.pathname.startsWith(item.path));
  const isDatabaseActive = DATABASE_ROUTES.some(item => location.pathname.startsWith(item.path));

  const isAdminActive = location.pathname.startsWith('/admin');

  // Drawer Content for Mobile
  const drawer = (
    <Box sx={{ width: 280, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="500">Menu</Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
            selected={isActive('/dashboard')}
            sx={{
              mx: 1,
              mb: 1,
              ...(isActive('/dashboard') && {
                bgcolor: 'transparent',
                '& .MuiListItemText-primary': {
                  color: 'primary.dark',
                  fontWeight: 600,
                }
              })
            }}
          >
            <ListItemText
              primary="Overview"
              primaryTypographyProps={{
                fontWeight: isActive('/dashboard') ? 600 : 400,
                sx: {
                  textDecoration: isActive('/dashboard') ? 'underline' : 'none',
                  textDecorationColor: isActive('/dashboard') ? 'primary.dark' : 'transparent',
                  textDecorationThickness: '2px',
                  textUnderlineOffset: '6px'
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setMobileDatabaseOpen(!mobileDatabaseOpen)}
            sx={{
              mx: 1,
              mb: 1,
              ...(isDatabaseActive && {
                bgcolor: 'transparent',
                '& .MuiListItemText-primary': {
                  color: 'primary.dark',
                  fontWeight: 600,
                }
              })
            }}
          >
            <ListItemText
              primary="Database"
              primaryTypographyProps={{
                fontWeight: isDatabaseActive ? 600 : 400,
                sx: {
                  textDecoration: isDatabaseActive ? 'underline' : 'none',
                  textDecorationColor: isDatabaseActive ? 'primary.dark' : 'transparent',
                  textDecorationThickness: '2px',
                  textUnderlineOffset: '6px'
                }
              }}
            />
            {mobileDatabaseOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={mobileDatabaseOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {DATABASE_ROUTES.map((item) => (
              <ListItemButton 
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{ 
                  pl: 4, 
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
                  {item.icon}
                </Box>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 600 : 400,
                    color: isActive(item.path) ? 'primary.dark' : 'text.primary'
                  }} 
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setMobileMarketsOpen(!mobileMarketsOpen)}
            sx={{
              mx: 1,
              mb: 1,
              ...(isMarketsActive && {
                bgcolor: 'transparent',
                '& .MuiListItemText-primary': {
                  color: 'primary.dark',
                  fontWeight: 600,
                }
              })
            }}
          >
            <ListItemText
              primary="Markets"
              primaryTypographyProps={{
                fontWeight: isMarketsActive ? 600 : 400,
                sx: {
                  textDecoration: isMarketsActive ? 'underline' : 'none',
                  textDecorationColor: isMarketsActive ? 'primary.dark' : 'transparent',
                  textDecorationThickness: '2px',
                  textUnderlineOffset: '6px'
                }
              }}
            />
            {mobileMarketsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={mobileMarketsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {MARKET_ITEMS.map((item) => (
              <ListItemButton 
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{ 
                  pl: 4, 
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
                  {item.icon}
                </Box>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 600 : 400,
                    color: isActive(item.path) ? 'primary.dark' : 'text.primary'
                  }} 
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setMobileResourceOpen(!mobileResourceOpen)}
            sx={{
              mx: 1,
              mb: 1,
              ...(isResourceActive && {
                bgcolor: 'transparent',
                '& .MuiListItemText-primary': {
                  color: 'primary.dark',
                  fontWeight: 600,
                }
              })
            }}
          >
            <ListItemText
              primary="Resource Center"
              primaryTypographyProps={{
                fontWeight: isResourceActive ? 600 : 400,
                sx: {
                  textDecoration: isResourceActive ? 'underline' : 'none',
                  textDecorationColor: isResourceActive ? 'primary.dark' : 'transparent',
                  textDecorationThickness: '2px',
                  textUnderlineOffset: '6px'
                }
              }}
            />
            {mobileResourceOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={mobileResourceOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {RESOURCE_ROUTES.map((item) => (
              <ListItemButton 
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{ 
                  pl: 4, 
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
                  {item.icon}
                </Box>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 600 : 400,
                    color: isActive(item.path) ? 'primary.dark' : 'text.primary'
                  }} 
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </List>
      <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        {isAuthenticated ? (
          <>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { logout(); navigate('/dashboard'); setMobileOpen(false); }}
              sx={{ borderRadius: '999px', fontWeight: 500, fontSize: '14px' }}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            fullWidth
            variant="contained"
            onClick={() => { setLoginModalOpen(true); setMobileOpen(false); }}
            startIcon={<LoginIcon />}
            sx={{
              borderRadius: '999px',
              fontWeight: 500,
              fontSize: '14px',
              backgroundColor: '#2E51FF',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#1B3CC7',
              }
            }}
          >
            Admin Login
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: { xs: '56px', sm: '64px' },
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: scrolled ? '0 4px 12px rgba(15, 23, 42, 0.05)' : 'none',
          zIndex: (theme) => theme.zIndex.appBar,
          transition: 'all 250ms ease',
        }}
        color="inherit"
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 4 } }}>
          <Toolbar disableGutters sx={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Left: Logo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/dashboard')}
            aria-label="Home"
          >
            {!logoError ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', mt: 1 }}>
                <Box
                  component="img"
                  src="/assets/logo.png"
                  alt="Prolt Energy"
                  onError={() => setLogoError(true)}
                  sx={{
                    maxHeight: { xs: '24px', sm: '36px' },
                    height: 'auto',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            ) : (
              <Typography
                variant="h6"
                noWrap
                sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: '-0.025em' }}
              >
                IEX Analytics
              </Typography>
            )}
          </Box>


          {/* Right: Actions */}
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, gap: 2, alignItems: 'center' }}>
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      logout();
                      navigate('/dashboard');
                    }}
                    sx={{
                      borderRadius: '999px',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '14px',
                      px: 3,
                      py: 0.75,
                      minHeight: '40px',
                      borderColor: alpha(theme.palette.text.primary, 0.3),
                      color: 'text.primary',
                      transition: 'all 250ms ease',
                      '@media (prefers-reduced-motion: no-preference)': {
                        '&:hover': {
                          borderColor: 'text.primary',
                          color: 'text.primary',
                          backgroundColor: alpha(theme.palette.text.primary, 0.05)
                        }
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        '&:hover': {
                          borderColor: 'text.primary',
                          color: 'text.primary',
                          backgroundColor: alpha(theme.palette.text.primary, 0.05)
                        }
                      }
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setLoginModalOpen(true)}
                  startIcon={<LoginIcon fontSize="small" />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                    borderRadius: '999px',
                    px: 3,
                    py: 0.75,
                    minHeight: '40px',
                    backgroundColor: '#2E51FF',
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    transition: 'all 250ms ease',
                    border: '1px solid transparent',
                    '&:hover': {
                      backgroundColor: '#1B3CC7',
                      borderColor: '#1B3CC7',
                      boxShadow: 'none',
                    }
                  }}
                >
                  Admin Login
                </Button>
              )}
            </Box>
          )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          zIndex: (theme) => theme.zIndex.modal + 1,
        }}
      >
        {drawer}
      </Drawer>

      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </>
  );
}
