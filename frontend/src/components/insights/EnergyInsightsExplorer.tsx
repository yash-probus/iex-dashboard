import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Tabs, Tab, Avatar, Chip, AppBar, Toolbar, Divider } from '@mui/material';
import { ArrowBack, LightbulbOutlined, ChevronLeft, ChevronRight, Notifications, Settings, Person } from '@mui/icons-material';
import WithoutProltTab from './WithoutProltTab';
import WithProltTab from './WithProltTab';

interface EnergyInsightsExplorerProps {
  onBack: () => void;
}

export default function EnergyInsightsExplorer({ onBack }: EnergyInsightsExplorerProps) {
  const [onboardState, setOnboardState] = useState<'not_onboarded' | 'onboarded' | 'industry'>('not_onboarded');
  const [connectionState, setConnectionState] = useState<'HV-1' | 'HV-2'>('HV-1');
  const [currentMonth, setCurrentMonth] = useState('Jul 2026');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0FDF4', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px' }}>
          
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={onBack}
              sx={{ color: 'text.primary', textTransform: 'none', fontWeight: 600 }}
            >
              Back to Calculator
            </Button>
            
            <Typography variant="h6" color="primary" fontWeight={800} sx={{ fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#EF4444' }}>Prolt</span>
              <span style={{ color: '#111827', marginLeft: '4px' }}>Energy</span>
            </Typography>

            <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', p: 0.5, borderRadius: 2 }}>
              <Button 
                onClick={() => setOnboardState('not_onboarded')}
                sx={{ 
                  bgcolor: onboardState === 'not_onboarded' ? 'white' : 'transparent',
                  color: onboardState === 'not_onboarded' ? 'text.primary' : 'text.secondary',
                  boxShadow: onboardState === 'not_onboarded' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'none', fontWeight: 600, px: 2, borderRadius: 1.5,
                  '&:hover': { bgcolor: onboardState === 'not_onboarded' ? 'white' : 'rgba(0,0,0,0.04)' }
                }}
              >
                Not Onboarded
              </Button>
              <Button 
                onClick={() => setOnboardState('onboarded')}
                sx={{ 
                  bgcolor: onboardState === 'onboarded' ? 'white' : 'transparent',
                  color: onboardState === 'onboarded' ? 'text.primary' : 'text.secondary',
                  boxShadow: onboardState === 'onboarded' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'none', fontWeight: 600, px: 2, borderRadius: 1.5,
                  '&:hover': { bgcolor: onboardState === 'onboarded' ? 'white' : 'rgba(0,0,0,0.04)' }
                }}
              >
                Onboarded
              </Button>
              <Button 
                onClick={() => setOnboardState('industry')}
                sx={{ 
                  bgcolor: onboardState === 'industry' ? 'white' : 'transparent',
                  color: onboardState === 'industry' ? 'text.primary' : 'text.secondary',
                  boxShadow: onboardState === 'industry' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'none', fontWeight: 600, px: 2, borderRadius: 1.5,
                  '&:hover': { bgcolor: onboardState === 'industry' ? 'white' : 'rgba(0,0,0,0.04)' }
                }}
              >
                Industry Insights
              </Button>
            </Box>

            <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', p: 0.5, borderRadius: 2 }}>
              <Button 
                onClick={() => setConnectionState('HV-1')}
                sx={{ 
                  bgcolor: connectionState === 'HV-1' ? 'white' : 'transparent',
                  color: connectionState === 'HV-1' ? 'text.primary' : 'text.secondary',
                  boxShadow: connectionState === 'HV-1' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'none', fontWeight: 600, px: 2, borderRadius: 1.5,
                  minWidth: 'auto',
                  '&:hover': { bgcolor: connectionState === 'HV-1' ? 'white' : 'rgba(0,0,0,0.04)' }
                }}
              >
                HV-1
              </Button>
              <Button 
                onClick={() => setConnectionState('HV-2')}
                sx={{ 
                  bgcolor: connectionState === 'HV-2' ? 'white' : 'transparent',
                  color: connectionState === 'HV-2' ? 'text.primary' : 'text.secondary',
                  boxShadow: connectionState === 'HV-2' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'none', fontWeight: 600, px: 2, borderRadius: 1.5,
                  minWidth: 'auto',
                  '&:hover': { bgcolor: connectionState === 'HV-2' ? 'white' : 'rgba(0,0,0,0.04)' }
                }}
              >
                HV-2
              </Button>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#F1F5F9', px: 2, py: 0.5, borderRadius: 5, gap: 1 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">Onboarding: Document Collection</Typography>
              <Chip size="small" label="3/8" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#94A3B8', color: 'white' }} />
            </Box>
            
            <IconButton size="small">
              <Notifications fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <Settings fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <Person fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dark Green Banner */}
      <Box sx={{ bgcolor: '#0F5132', color: 'white', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <LightbulbOutlined sx={{ color: '#EF4444' }} />
          <Typography variant="h4" fontWeight={700}>Energy Insights Explorer</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <ChevronLeft />
          </IconButton>
          <Box sx={{ bgcolor: '#DC2626', color: 'white', px: 3, py: 0.5, borderRadius: 1.5, fontWeight: 700 }}>
            {currentMonth}
          </Box>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <ChevronRight />
          </IconButton>
        </Box>
        
        {onboardState === 'onboarded' && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Chip label="Total Energy Cost: ₹3,560,000" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }} />
            <Chip label="Savings Achieved: ₹750,000 (21%)" sx={{ bgcolor: '#166534', color: 'white', fontWeight: 600, border: '1px solid #22C55E' }} />
            <Chip label="Optimization Efficiency: 97.5% adherence" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }} />
          </Box>
        )}
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          
          {onboardState === 'not_onboarded' && (
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                Transparent breakdown of your DISCOM electricity bill — showing exactly where your money is going.
              </Typography>
            </Box>
          )}

          {onboardState === 'not_onboarded' && <WithoutProltTab />}
          {onboardState === 'onboarded' && <WithProltTab />}
          {onboardState === 'industry' && (
             <Box sx={{ textAlign: 'center', py: 10 }}>
               <Typography variant="h5" color="text.secondary" fontWeight={600}>Industry Insights coming soon...</Typography>
             </Box>
          )}

        </Box>
      </Box>

      {/* Bottom bar for "Back to Calculator" if needed, though top header has it */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack} sx={{ borderRadius: 2, fontWeight: 600, px: 3, py: 1 }}>
          Back to Calculator
        </Button>
      </Box>

    </Box>
  );
}
