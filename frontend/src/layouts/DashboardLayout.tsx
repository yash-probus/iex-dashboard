import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from '../components/Navbar';
import GlobalSubHeader from '../components/common/GlobalSubHeader';

export default function DashboardLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      <GlobalSubHeader />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 0,
          pb: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3, px: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
