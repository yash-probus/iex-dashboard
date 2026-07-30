import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, CircularProgress, Alert, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth.api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Captcha states
  const [captchaNum1, setCaptchaNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaNum2, setCaptchaNum2] = useState(Math.floor(Math.random() * 10) + 1);
  const [userCaptcha, setUserCaptcha] = useState('');

  // Resend cooldown state
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  React.useEffect(() => {
    document.documentElement.classList.add('login-page');
    return () => {
      document.documentElement.classList.remove('login-page');
    };
  }, []);

  // Handle countdown timer for Resend OTP
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const generateNewCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setUserCaptcha('');
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    if (step === 'EMAIL') {
      const correctAnswer = captchaNum1 + captchaNum2;
      if (parseInt(userCaptcha) !== correctAnswer) {
        setError('Incorrect CAPTCHA. Please try again.');
        generateNewCaptcha();
        return;
      }
    }

    setLoading(true);
    try {
      const response = await authApi.sendOtp(trimmedEmail);
      if (response.success) {
        setStep('OTP');
        setResendCooldown(30); // Start 30s cooldown
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOtp(email.trim(), otp);
      if (response.success) {
        login(response.token, response.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
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
        backgroundImage: 'url(/image.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background elements */}
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
        <Box sx={{ maxWidth: 450 }}>
          <Box 
            component="img"
            src="/assets/logo.png"
            alt="IEX Dashboard Logo"
            sx={{ 
              height: 'auto',
              width: '100%',
              maxWidth: 400,
              mb: 2,
              filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.1))'
            }}
          />
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
            bgcolor: 'rgba(255, 255, 255, 0.45)', 
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ p: 4, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Typography variant="h2" sx={{ color: '#0d47a1', fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5, fontSize: '2.2rem' }}>
                Welcome
              </Typography>
              <Typography variant="body2" sx={{ color: '#555', opacity: 0.8, fontWeight: 500 }}>
                {step === 'EMAIL' ? 'Sign in with your email' : 'Enter the OTP sent to your email'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.05)', color: '#d32f2f', '& .MuiAlert-icon': { color: '#d32f2f' } }}>
                {error}
              </Alert>
            )}

            {step === 'EMAIL' ? (
              <Box component="form" onSubmit={handleSendOtp} noValidate>
                <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, mb: 0.5, display: 'block' }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                />

                <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, mb: 0.5, display: 'block' }}>
                  What is {captchaNum1} + {captchaNum2}? (Security Check)
                </Typography>
                <TextField
                  fullWidth
                  id="captcha"
                  name="captcha"
                  type="number"
                  placeholder="Enter answer"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
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
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ 
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleVerifyOtp} noValidate>
                <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, mb: 0.5, display: 'block' }}>
                  6-Digit OTP
                </Typography>
                <TextField
                  fullWidth
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  size="small"
                  placeholder="Enter 6-digit code"
                  inputProps={{ style: { letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 } }}
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f4f6f8',
                      borderRadius: 1.5,
                      '& fieldset': { border: '1px solid rgba(0,0,0,0.05)' }
                    }
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || otp.length !== 6}
                  sx={{ 
                    mb: 2, 
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Login'}
                </Button>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => handleSendOtp()}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </Button>

                  <Button 
                    fullWidth 
                    variant="text" 
                    onClick={() => { 
                      setStep('EMAIL'); 
                      setOtp(''); 
                      generateNewCaptcha(); 
                    }}
                    sx={{ textTransform: 'none', color: '#555', fontWeight: 600 }}
                  >
                    Back to Email
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
