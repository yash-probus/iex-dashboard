import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, CircularProgress, Alert, InputAdornment, IconButton, Paper
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
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

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

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        backgroundImage: 'url(/image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: 350 }}>
          <Box 
            component="img" 
            src="/assets/logo.png" 
            alt="Logo" 
            sx={{ 
              height: 'auto', 
              width: '100%', 
              objectFit: 'contain' 
            }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <Typography variant="body1" sx={{ color: '#555', display: 'flex', alignItems: 'center', mt: 1 }}>
            Powered by 
            <Box 
              component="img" 
              src="/assets/logo.jpeg" 
              alt="Probus Logo" 
              sx={{ height: 25, ml: 1, borderRadius: 1 }} 
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
              <Typography 
                variant="caption" 
                sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              >
                {showDemoCredentials ? <VisibilityOff sx={{ fontSize: 14, mr: 0.5 }} /> : <Visibility sx={{ fontSize: 14, mr: 0.5 }} />}
                {showDemoCredentials ? 'Hide' : 'Show'}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', mb: 3, opacity: 0.8, lineHeight: 1.4 }}>
              Smart Utility Monitoring Platform
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.05)', color: '#d32f2f', '& .MuiAlert-icon': { color: '#d32f2f' } }}>
                {error}
              </Alert>
            )}

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

              {showDemoCredentials && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#555', display: 'block', mb: 0.5 }}>
                    Demo Credentials:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#333', fontFamily: 'monospace', display: 'block' }}>
                    admin / admin
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
