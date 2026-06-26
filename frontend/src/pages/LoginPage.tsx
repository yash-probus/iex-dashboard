import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <LoginModal 
        open={true} 
        onClose={() => navigate('/dashboard', { replace: true })} 
        onSuccess={() => navigate('/admin', { replace: true })}
      />
    </Box>
  );
}
