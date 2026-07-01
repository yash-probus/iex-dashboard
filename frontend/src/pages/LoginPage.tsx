import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, CircularProgress, Alert, InputAdornment, IconButton, Paper, Tab, Tabs
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth.api';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login(trimmedUser, password);
      if (response.success) {
        login(response.token, response.admin);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        bgcolor: '#f4f6f8', // Light background
        backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 0%, #eef2f6 70%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background elements (stars/dots) */}
      <Box sx={{ position: 'absolute', top: '20%', left: '15%', width: 4, height: 4, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '50%', boxShadow: '0 0 10px 2px rgba(0,0,0,0.05)' }} />
      <Box sx={{ position: 'absolute', top: '40%', left: '30%', width: 3, height: 3, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: '50%', boxShadow: '0 0 8px 1px rgba(0,0,0,0.05)' }} />
      <Box sx={{ position: 'absolute', bottom: '30%', left: '45%', width: 5, height: 5, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: '50%', boxShadow: '0 0 12px 3px rgba(0,0,0,0.08)' }} />

      {/* Left Content Area */}
      <Box 
        sx={{ 
          flex: 1, 
          display: { xs: 'none', md: 'flex' }, 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          pl: '10%',
          pr: 4,
          position: 'relative',
          zIndex: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            component="img" 
            src="/assets/logo.png" 
            alt="Logo" 
            sx={{ 
              height: 'auto', 
              maxWidth: 350, 
              objectFit: 'contain' 
            }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <Box sx={{ ml: 3 }}>
            <Typography variant="h2" sx={{ color: '#0d47a1', fontWeight: 800, letterSpacing: 2, mb: 0.5 }}>
              IEX DASHBOARD
            </Typography>
            <Typography variant="h6" sx={{ color: '#555', fontWeight: 400 }}>
              Powering Progress, Lighting Lives
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, opacity: 0.8 }}>
          <Typography variant="body1" sx={{ color: '#333', display: 'flex', alignItems: 'center' }}>
            Powered by 
            <Box 
              component="img" 
              src="/assets/logo.jpeg" 
              alt="Probus Logo" 
              sx={{ height: 30, ml: 1.5, borderRadius: 1 }} 
            />
          </Typography>
        </Box>
      </Box>

      {/* Right Content Area (Login Form) */}
      <Box 
        sx={{ 
          flex: { xs: 1, md: 0.8 }, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
          p: 3
        }}
      >
        <Paper 
          elevation={24}
          sx={{ 
            width: '100%', 
            maxWidth: 420, 
            bgcolor: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ p: 4, pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" sx={{ color: '#0d47a1', fontWeight: 700 }}>
                Sign In
              </Typography>
              <Typography variant="caption" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Visibility sx={{ fontSize: 14, mr: 0.5 }} /> Show
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', mb: 3, opacity: 0.8, lineHeight: 1.4 }}>
              Powering Progress, Lighting Lives — Smart Utility Monitoring Platform
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'rgba(0,0,0,0.08)', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    color: '#666',
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 40,
                    fontSize: '0.9rem',
                    '&.Mui-selected': {
                      color: '#0d47a1',
                      bgcolor: 'rgba(0,0,0,0.03)',
                      borderRadius: '4px 4px 0 0'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    display: 'none' // Hidden as per design
                  }
                }}
              >
                <Tab label="Login" />
                <Tab label="Sign Up" />
                <Tab label="Reset Password" />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.05)', color: '#d32f2f', '& .MuiAlert-icon': { color: '#d32f2f' } }}>
                {error}
              </Alert>
            )}

            {tabValue === 0 && (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, mb: 0.5, display: 'block' }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    mb: 2.5,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f4f6f8',
                      borderRadius: 1.5,
                      '& fieldset': { border: '1px solid rgba(0,0,0,0.05)' }
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>
                    Password
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1976d2', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    Forgot Password?
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f4f6f8',
                      borderRadius: 1.5,
                      '& fieldset': { border: '1px solid rgba(0,0,0,0.05)' }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    mt: 1, 
                    mb: 1, 
                    py: 1.2, 
                    bgcolor: '#4CAF50', 
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      bgcolor: '#45a049',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                </Button>
              </Box>
            )}
            
            {tabValue !== 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography sx={{ color: '#666' }}>
                  This feature is not currently available in the demo.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
