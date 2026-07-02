import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2.5, px: { xs: 2, sm: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
