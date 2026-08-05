import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

export const RedesignedSavingsReport: React.FC<{ calcEntry: any; marketDecisionResult: any; month: string }> = ({ calcEntry, marketDecisionResult, month }) => {
  const { results, assumptions } = calcEntry;
  const metrics = results?.annualMetrics || {};
  const clientName = calcEntry.clientName || 'Client';

  return (
    <Box className="redesigned-pdf-report" sx={{ display: 'none', backgroundColor: '#FFFFFF', color: '#0F172A' }}>
      
      {/* PAGE 1 */}
      <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ textTransform: 'uppercase', mb: 2, color: '#64748B', fontSize: '18px', fontWeight: 600 }}>
            {assumptions?.analysisYear || new Date().getFullYear()}
          </Typography>
          <Typography sx={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.1, color: '#0F172A' }}>
            Your Monthly<br/>Energy Savings Report
          </Typography>
          <Typography sx={{ color: '#475569', fontSize: '20px', mt: 2, fontWeight: 500 }}>
            Smarter power. Lower cost. Clear results.
          </Typography>
        </Box>

        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Box>
            <Typography sx={{ textTransform: 'uppercase', color: '#64748B', fontWeight: 600, mb: 1, letterSpacing: 1 }}>Your Confirmed Savings</Typography>
            <Typography sx={{ fontSize: '36px', color: '#16A34A', fontWeight: 800 }}>
              ₹{Math.round(metrics.netSavings || 0).toLocaleString('en-IN')}
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '16px' }}>saved in this period</Typography>
          </Box>
          <Box>
            <Typography sx={{ textTransform: 'uppercase', color: '#64748B', fontWeight: 600, mb: 1, letterSpacing: 1 }}>Saving On Your Baseline Bill</Typography>
            <Typography sx={{ fontSize: '36px', color: '#0284C7', fontWeight: 800 }}>
              {metrics.savingsPercentage?.toFixed(1) || 0}%
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '16px' }}>A meaningful reduction</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 'auto', pt: 6, borderTop: '2px solid #E2E8F0' }}>
          <Typography sx={{ color: '#64748B', fontSize: '14px', mb: 1 }}>Prepared for</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '20px' }}>{clientName}</Typography>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>01</Typography>
        </Box>
      </Box>

      {/* PAGE 2 */}
      <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
        <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>THE MONTH IN ONE GLANCE</Typography>
        <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>What Prolt delivered for you</Typography>
        <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>Your key energy and savings results, without the technical clutter.</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 6 }}>
          <Box sx={{ p: 4, backgroundColor: '#F0FDF4', borderRadius: 3 }}>
            <Typography sx={{ color: '#166534', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Your Confirmed Savings</Typography>
            <Typography sx={{ color: '#15803D', fontWeight: 800, fontSize: '28px' }}>₹{(Math.round((metrics.netSavings || 0)/1000)/100).toFixed(2)} lakh</Typography>
          </Box>
          <Box sx={{ p: 4, backgroundColor: '#F0F9FF', borderRadius: 3 }}>
            <Typography sx={{ color: '#0369A1', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Savings Per Unit</Typography>
            <Typography sx={{ color: '#0284C7', fontWeight: 800, fontSize: '28px' }}>
              ₹{((metrics.netSavings || 0) / (metrics.totalConsumption || 1)).toFixed(2)} / kWh
            </Typography>
          </Box>
          <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3 }}>
            <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Your Final Blended Cost</Typography>
            <Typography sx={{ color: '#334155', fontWeight: 800, fontSize: '28px' }}>
              ₹{((metrics.finalCost || 0) / (metrics.totalConsumption || 1)).toFixed(2)} / kWh
            </Typography>
          </Box>
          <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3 }}>
            <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Total Electricity Used</Typography>
            <Typography sx={{ color: '#334155', fontWeight: 800, fontSize: '28px' }}>{Math.round(metrics.totalConsumption || 0).toLocaleString('en-IN')} kWh</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 'auto', p: 4, backgroundColor: '#F8FAFC', borderRadius: 3 }}>
           <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '18px' }}>THE TAKEAWAY</Typography>
           <Typography sx={{ fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>
             Prolt reduced your electricity cost by nearly ₹{(Math.round((metrics.netSavings || 0)/1000)/100).toFixed(2)} lakh.
             That is a {(metrics.savingsPercentage || 0).toFixed(1)}% reduction compared with buying the same electricity entirely from the DISCOM.
           </Typography>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>02</Typography>
        </Box>
      </Box>

      {/* PAGE 3: POWER MIX */}
      <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
        <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>YOUR POWER MIX</Typography>
        <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>Where your electricity came from</Typography>
        <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>We combined Open Access market power with DISCOM supply to lower your overall cost.</Typography>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <Typography sx={{ fontSize: '64px', fontWeight: 800, color: '#2E51FF' }}>
             {((metrics.oaConsumption || 0) / (metrics.totalConsumption || 1) * 100).toFixed(1)}%
           </Typography>
           <Typography sx={{ fontSize: '24px', color: '#64748B', ml: 2, maxWidth: '200px' }}>delivered through Open Access</Typography>
        </Box>

        <Box sx={{ mt: 'auto', mb: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3, borderLeft: '4px solid #2E51FF' }}>
            <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>OPEN ACCESS DELIVERED</Typography>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '28px' }}>{Math.round(metrics.oaConsumption || 0).toLocaleString('en-IN')} kWh</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '14px', mt: 1 }}>Clean market power reaching your facility</Typography>
          </Box>
          <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3, borderLeft: '4px solid #94A3B8' }}>
            <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>BALANCE FROM DISCOM</Typography>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '28px' }}>{Math.round((metrics.totalConsumption || 0) - (metrics.oaConsumption || 0)).toLocaleString('en-IN')} kWh</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '14px', mt: 1 }}>Reliable supply retained for uncovered demand</Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>03</Typography>
        </Box>
      </Box>

      {/* PAGE 4-8 CAN BE EXPANDED AS NEEDED */}
      <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
        <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>HOW YOUR BILL CAME DOWN</Typography>
        <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>From regular tariff to a smarter energy bill</Typography>
        <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>A simple reconciliation of the savings story shown in the source report.</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', pb: 2 }}>
            <Typography sx={{ fontSize: '24px', color: '#64748B' }}>Baseline bill</Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 700 }}>₹{Math.round(metrics.baselineCost || 0).toLocaleString('en-IN')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', pb: 2 }}>
            <Typography sx={{ fontSize: '24px', color: '#64748B' }}>Final cost</Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 700 }}>₹{Math.round(metrics.finalCost || 0).toLocaleString('en-IN')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Typography sx={{ fontSize: '28px', color: '#16A34A', fontWeight: 700 }}>YOUR NET BENEFIT</Typography>
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#16A34A' }}>₹{Math.round(metrics.netSavings || 0).toLocaleString('en-IN')}</Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
          <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>04</Typography>
        </Box>
      </Box>

    </Box>
  );
};
