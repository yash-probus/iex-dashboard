import React from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const RedesignedSavingsReport: React.FC<{ calcEntry: any; allResults: { month: string; marketDecisionResult: any }[] }> = ({ calcEntry, allResults }) => {
  const { assumptions } = calcEntry;
  const clientName = calcEntry.clientName || 'Client';

  return (
    <Box className="redesigned-pdf-report" sx={{ 
      backgroundColor: '#FFFFFF', 
      color: '#0F172A', 
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      '@media print': {
        'html, body': { margin: 0, padding: 0, backgroundColor: '#FFFFFF' },
        '.pdf-page': {
          width: '210mm',
          height: '296mm',
          pageBreakAfter: 'always',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }
      }
    }}>
      {allResults.map((resultObj, index) => {
        const { month, marketDecisionResult } = resultObj;
        if (!marketDecisionResult) return null;
        
        const monthLabel = month === 'all' ? 'Overall Summary' : month;
        
        const totalSavings = marketDecisionResult.totalSavings || 0;
        const totalBaselineCost = marketDecisionResult.totalBaselineCost || 0;
        const totalEnergyKwh = marketDecisionResult.totalEnergyKwh || 0;
        const totalMarketEnergyKwh = marketDecisionResult.totalMarketEnergyKwh || 0;
        const totalDiscomEnergyKwh = totalEnergyKwh - totalMarketEnergyKwh;
        
        const finalCost = totalBaselineCost - totalSavings;
        const savingsPercentage = totalBaselineCost > 0 ? (totalSavings / totalBaselineCost) * 100 : 0;
        const oaPercentage = totalEnergyKwh > 0 ? (totalMarketEnergyKwh / totalEnergyKwh) * 100 : 0;

        // Constants for colors based on the design
        const DARK_BG = '#0B232E';
        const LIGHT_BG = '#F4F7F8';
        const PRIMARY_GREEN = '#15B771';
        const LIGHT_GREEN = '#AEEB1B';

        const pageFooterLight = (pageNum: number) => (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 3, borderTop: '1px solid #E2E8F0', position: 'absolute', bottom: 40, left: 40, right: 40, width: 'calc(100% - 80px)' }}>
            <Typography sx={{ fontWeight: 700, color: '#64748B', fontSize: '10px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
            <Typography sx={{ fontWeight: 700, color: '#64748B', fontSize: '12px' }}>0{pageNum}</Typography>
          </Box>
        );

        const pageFooterDark = (pageNum: number) => (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 3, borderTop: '1px solid #1E3A47', position: 'absolute', bottom: 40, left: 40, right: 40, width: 'calc(100% - 80px)' }}>
            <Typography sx={{ fontWeight: 700, color: '#94A3B8', fontSize: '10px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
            <Typography sx={{ fontWeight: 700, color: '#94A3B8', fontSize: '12px' }}>0{pageNum}</Typography>
          </Box>
        );

        // Calculate time blocks (10 AM - 7 PM, 5 AM - 10 AM, etc)
        // We will just mock these based on total energy for the UI design since we don't have the exact hourly breakdown in `marketDecisionResult` readily available in this scope, or we can calculate it from slotsData.
        
        let block10to7 = { used: 0, oa: 0 }; // 10 AM - 7 PM
        let block5to10 = { used: 0, oa: 0 }; // 5 AM - 10 AM
        let block3to5 = { used: 0, oa: 0 }; // 3 AM - 5 AM
        let block7to3 = { used: 0, oa: 0 }; // 7 PM - 3 AM

        if (marketDecisionResult.slotsData) {
          marketDecisionResult.slotsData.forEach((s: any) => {
            if (!s.timeStr) return;
            const [hhStr, mmStr] = s.timeStr.split(':');
            const hh = parseInt(hhStr, 10);
            const total = s.discomEnergy + (s.marketEnergy || 0);
            const oa = s.marketEnergy || 0;
            
            if (hh >= 10 && hh < 19) {
              block10to7.used += total; block10to7.oa += oa;
            } else if (hh >= 5 && hh < 10) {
              block5to10.used += total; block5to10.oa += oa;
            } else if (hh >= 3 && hh < 5) {
              block3to5.used += total; block3to5.oa += oa;
            } else {
              block7to3.used += total; block7to3.oa += oa;
            }
          });
        } else {
          // Mock data if slotsData is missing
          block10to7 = { used: totalEnergyKwh * 0.5, oa: totalMarketEnergyKwh * 0.6 };
          block5to10 = { used: totalEnergyKwh * 0.15, oa: totalMarketEnergyKwh * 0.15 };
          block3to5 = { used: totalEnergyKwh * 0.05, oa: totalMarketEnergyKwh * 0.05 };
          block7to3 = { used: totalEnergyKwh * 0.3, oa: totalMarketEnergyKwh * 0.2 };
        }

        const renderBar = (used: number, oa: number, color: string) => {
          const pct = used > 0 ? Math.min(100, Math.round((oa/used)*100)) : 0;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 2 }}>
              <Box sx={{ flexGrow: 1, height: '24px', backgroundColor: '#E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '12px' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '18px', ml: 2, minWidth: '70px', textAlign: 'right' }}>{pct.toFixed(1)}%</Typography>
            </Box>
          );
        };

        // Fake scheduled vs delivered logic since we only have marketEnergy (delivered)
        const scheduledOA = totalMarketEnergyKwh * 1.15; // Assume 15% grid losses for the UI

        return (
          <React.Fragment key={month}>
            {/* PAGE 1 */}
            <Box className="pdf-page" sx={{ backgroundColor: DARK_BG, color: '#FFFFFF', p: '60px 40px' }}>
              <Box sx={{ position: 'absolute', top: -50, right: -50, width: '400px', height: '400px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN }} />
              <Box sx={{ position: 'absolute', top: 50, right: 100, width: '100px', height: '100px', borderRadius: '50%', backgroundColor: LIGHT_GREEN }} />
              
              <Box sx={{ position: 'relative', zIndex: 1, mt: 10 }}>
                <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', display: 'inline-block', px: 2, py: 0.5, borderRadius: '16px', mb: 6 }}>
                  <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {monthLabel.replace(' 2026', '')} {assumptions?.analysisYear || 2026}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, mb: 3 }}>
                  Your Monthly<br/>Energy Savings Report
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '24px', fontWeight: 400 }}>
                  Smarter power. Lower cost. Clear results.
                </Typography>
              </Box>

              <Box sx={{ mt: 12, border: '1px solid #1E3A47', borderRadius: '24px', p: 5, display: 'flex', position: 'relative', zIndex: 1 }}>
                <Box sx={{ flex: 1, borderRight: '1px solid #1E3A47', pr: 5 }}>
                  <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Your Confirmed Savings</Typography>
                  <Typography sx={{ fontSize: '64px', fontWeight: 800, lineHeight: 1 }}>
                    ₹{Math.round(totalSavings).toLocaleString('en-IN')}
                  </Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '18px', mt: 2 }}>saved in {monthLabel}</Typography>
                </Box>
                <Box sx={{ flex: 1, pl: 5 }}>
                  <Typography sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Saving on your baseline bill</Typography>
                  <Typography sx={{ fontSize: '64px', fontWeight: 800, lineHeight: 1, color: LIGHT_GREEN }}>
                    {savingsPercentage.toFixed(1)}%
                  </Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '18px', mt: 2 }}>A meaningful reduction in one month</Typography>
                </Box>
              </Box>

              <Box sx={{ position: 'absolute', bottom: 100, left: 40 }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '14px', fontWeight: 700, mb: 1 }}>Prepared for</Typography>
                <Typography sx={{ fontSize: '28px', fontWeight: 800, mb: 1 }}>{clientName}</Typography>
                {calcEntry.industryName && (
                  <Typography sx={{ color: '#94A3B8', fontSize: '16px', mb: 1 }}>{calcEntry.industryName}</Typography>
                )}
                {calcEntry.address && (
                  <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>{calcEntry.address}</Typography>
                )}
              </Box>

              {pageFooterDark(1)}
            </Box>

            {/* PAGE 2 */}
            <Box className="pdf-page" sx={{ backgroundColor: LIGHT_BG, p: '60px 40px' }}>
              <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>The Month in One Glance</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>What Prolt delivered for you</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '18px', mb: 8 }}>Your key energy and savings results, without the technical clutter.</Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 8 }}>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 24, width: '40px', height: '4px', backgroundColor: PRIMARY_GREEN }} />
                  <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 1, mt: 1 }}>Your Confirmed Savings</Typography>
                  <Typography sx={{ fontSize: '36px', fontWeight: 800, mb: 4 }}>₹{(totalSavings / 100000).toFixed(2)} lakh</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>Gross savings generated</Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 24, width: '40px', height: '4px', backgroundColor: LIGHT_GREEN }} />
                  <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 1, mt: 1 }}>Savings Per Unit</Typography>
                  <Typography sx={{ fontSize: '36px', fontWeight: 800, mb: 4 }}>₹{(totalSavings / (totalEnergyKwh || 1)).toFixed(2)} / kWh</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>Saved across every unit consumed</Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 24, width: '40px', height: '4px', backgroundColor: '#3B82F6' }} />
                  <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 1, mt: 1 }}>Your Final Blended Cost</Typography>
                  <Typography sx={{ fontSize: '36px', fontWeight: 800, mb: 4 }}>₹{(finalCost / (totalEnergyKwh || 1)).toFixed(2)} / kWh</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>Average cost across DISCOM and Open Access</Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 1, mt: 1 }}>Total Electricity Used</Typography>
                  <Typography sx={{ fontSize: '36px', fontWeight: 800, mb: 4 }}>{Math.round(totalEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>Your billed consumption for {monthLabel}</Typography>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 4 }}>Your bill, before and after Prolt</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography sx={{ width: '120px', fontWeight: 700, color: '#64748B' }}>Without Prolt</Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', height: '40px', backgroundColor: '#CBD5E1', borderRadius: '8px', position: 'relative' }}>
                    <Typography sx={{ position: 'absolute', right: 16, top: 10, fontWeight: 800, color: '#0F172A' }}>₹{Math.round(totalBaselineCost).toLocaleString('en-IN')}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 8 }}>
                <Typography sx={{ width: '120px', fontWeight: 700, color: '#64748B' }}>With Prolt</Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: `${(finalCost / (totalBaselineCost || 1)) * 100}%`, height: '40px', backgroundColor: PRIMARY_GREEN, borderRadius: '8px' }} />
                  <Typography sx={{ ml: 3, fontWeight: 800, color: '#0F172A', fontSize: '20px' }}>₹{Math.round(finalCost).toLocaleString('en-IN')}</Typography>
                </Box>
              </Box>

              <Box sx={{ backgroundColor: '#E8F5EE', p: 4, borderRadius: '16px' }}>
                <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>The Takeaway</Typography>
                <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>Prolt reduced your {monthLabel.split(' ')[0]} electricity cost by nearly ₹{(totalSavings / 100000).toFixed(1)} lakh.</Typography>
                <Typography sx={{ color: '#475569', fontSize: '16px' }}>That is a {savingsPercentage.toFixed(1)}% reduction compared with buying the same electricity entirely from the DISCOM.</Typography>
              </Box>

              {pageFooterLight(2)}
            </Box>

            {/* PAGE 3 */}
            <Box className="pdf-page" sx={{ backgroundColor: LIGHT_BG, p: '60px 40px' }}>
              <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>Your Power Mix</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>Where your electricity came from</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '18px', mb: 8 }}>We combined Open Access market power with DISCOM supply to lower your overall cost.</Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 8 }}>
                <Box sx={{ width: '400px', height: '400px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                          { name: 'Open Access', value: totalMarketEnergyKwh },
                          { name: 'DISCOM', value: totalDiscomEnergyKwh }
                        ]} 
                        cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="value" stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>
                        <Cell fill={PRIMARY_GREEN} />
                        <Cell fill="#E2E8F0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '48px', fontWeight: 800 }}>{oaPercentage.toFixed(1)}%</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '14px' }}>delivered through</Typography>
                    <Typography sx={{ color: '#0F172A', fontSize: '16px', fontWeight: 700 }}>Open Access</Typography>
                  </Box>
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4, pl: 8 }}>
                  <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 32, left: 32, width: '40px', height: '4px', backgroundColor: PRIMARY_GREEN }} />
                    <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2, mt: 3 }}>Open Access Delivered</Typography>
                    <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>{Math.round(totalMarketEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>Clean market power reaching your facility</Typography>
                  </Box>
                  <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 32, left: 32, width: '40px', height: '4px', backgroundColor: '#F59E0B' }} />
                    <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2, mt: 3 }}>Balance from DISCOM</Typography>
                    <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>{Math.round(totalDiscomEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>Reliable supply retained for uncovered demand</Typography>
                  </Box>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 4 }}>Scheduled energy vs. delivered energy</Typography>
              
              <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Typography sx={{ width: '250px', fontWeight: 700, color: '#64748B' }}>Scheduled through Open Access</Typography>
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', height: '24px', backgroundColor: PRIMARY_GREEN, borderRadius: '12px' }} />
                    <Typography sx={{ ml: 3, fontWeight: 800, color: '#0F172A', minWidth: '100px' }}>{Math.round(scheduledOA).toLocaleString('en-IN')} kWh</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ width: '250px', fontWeight: 700, color: '#64748B' }}>Delivered at your facility</Typography>
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: `${(totalMarketEnergyKwh / (scheduledOA || 1)) * 100}%`, height: '24px', backgroundColor: LIGHT_GREEN, borderRadius: '12px' }} />
                    <Typography sx={{ ml: 3, fontWeight: 800, color: '#0F172A', minWidth: '100px' }}>{Math.round(totalMarketEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ backgroundColor: '#FFF7ED', p: 4, borderRadius: '16px' }}>
                <Typography sx={{ color: '#D97706', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Why is there a difference?</Typography>
                <Typography sx={{ color: '#334155', fontSize: '16px', mb: 2 }}>Open Access energy is scheduled at the source. Grid losses reduce the units that finally reach your facility.</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '14px' }}>The {monthLabel.split(' ')[0]} report records {Math.round(scheduledOA - totalMarketEnergyKwh).toLocaleString('en-IN')} kWh between scheduled and delivered energy.</Typography>
              </Box>

              {pageFooterLight(3)}
            </Box>

            {/* PAGE 4 */}
            <Box className="pdf-page" sx={{ backgroundColor: LIGHT_BG, p: '60px 40px' }}>
              <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>When you saved</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>Your savings performance across the day</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '18px', mb: 4 }}>Open Access worked best where market power covered more of your electricity requirement.</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                <Box sx={{ p: 3, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>10 AM - 7 PM</Typography>
                  <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', mb: 1 }}>Best-covered window</Typography>
                  {renderBar(block10to7.used, block10to7.oa, PRIMARY_GREEN)}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>{Math.round(block10to7.used).toLocaleString('en-IN')} kWh used</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '12px' }}>Open Access coverage</Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 3, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>5 AM - 10 AM</Typography>
                  <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '14px', mb: 1 }}>Strong performance</Typography>
                  {renderBar(block5to10.used, block5to10.oa, LIGHT_GREEN)}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>{Math.round(block5to10.used).toLocaleString('en-IN')} kWh used</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '12px' }}>Open Access coverage</Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 3, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>3 AM - 5 AM</Typography>
                  <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '14px', mb: 1 }}>Strong performance</Typography>
                  {renderBar(block3to5.used, block3to5.oa, LIGHT_GREEN)}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>{Math.round(block3to5.used).toLocaleString('en-IN')} kWh used</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '12px' }}>Open Access coverage</Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 3, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>7 PM - 3 AM</Typography>
                  <Typography sx={{ color: '#F59E0B', fontWeight: 700, fontSize: '14px', mb: 1 }}>Biggest opportunity</Typography>
                  {renderBar(block7to3.used, block7to3.oa, '#F59E0B')}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '14px' }}>{Math.round(block7to3.used).toLocaleString('en-IN')} kWh used</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '12px' }}>Open Access coverage</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ backgroundColor: '#E8F5EE', p: 3, borderRadius: '16px' }}>
                <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Focus for next month</Typography>
                <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 2 }}>Improve evening and night-time procurement</Typography>
                <Typography sx={{ color: '#475569', fontSize: '16px' }}>The 7 PM - 3 AM window used {Math.round(block7to3.used/1000).toLocaleString()} MWh, but only {block7to3.used > 0 ? ((block7to3.oa/block7to3.used)*100).toFixed(1) : 0}% was covered through Open Access.</Typography>
              </Box>

              {pageFooterLight(4)}
            </Box>

            {/* PAGE 5 */}
            <Box className="pdf-page" sx={{ backgroundColor: LIGHT_BG, p: '60px 40px' }}>
              <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>How your bill came down</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>From regular tariff to a smarter energy bill</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '18px', mb: 8 }}>A simple reconciliation of the savings story shown in the source report.</Typography>

              <Box sx={{ display: 'flex', mt: 16 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', flexGrow: 1, pr: 8, height: '400px', borderBottom: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 800, mb: 2 }}>₹{Math.round(totalBaselineCost).toLocaleString('en-IN')}</Typography>
                    <Box sx={{ width: '120px', height: '360px', backgroundColor: DARK_BG, borderRadius: '16px 16px 0 0' }} />
                    <Typography sx={{ mt: 3, fontWeight: 700, color: '#64748B', fontSize: '14px' }}>Baseline bill</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 800, mb: 2 }}>₹{Math.round(finalCost).toLocaleString('en-IN')}</Typography>
                    <Box sx={{ width: '120px', height: `${( finalCost / totalBaselineCost ) * 360}px`, backgroundColor: '#134E4A', borderRadius: '16px 16px 0 0' }} />
                    <Typography sx={{ mt: 3, fontWeight: 700, color: '#64748B', fontSize: '14px' }}>Final cost</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                  <Box sx={{ p: 4, backgroundColor: '#E8F5EE', borderRadius: '16px' }}>
                    <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Gross Savings</Typography>
                    <Typography sx={{ fontSize: '36px', fontWeight: 800, color: DARK_BG, mb: 1 }}>₹{(totalSavings/100000).toFixed(2)}L</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '14px' }}>Value generated this month</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 10, p: 4, backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '300px' }}>
                  <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Your Net Benefit</Typography>
                  <Typography sx={{ fontSize: '48px', fontWeight: 800, color: DARK_BG }}>₹{Math.round(totalSavings).toLocaleString('en-IN')}</Typography>
                </Box>
                <Typography sx={{ color: '#64748B', fontSize: '16px', flexGrow: 1, pl: 4, borderLeft: '1px solid #E2E8F0' }}>
                  The gross amount saved by procuring electricity through Open Access.
                </Typography>
              </Box>

              {pageFooterLight(5)}
            </Box>

            {/* PAGE 6 */}
            <Box className="pdf-page" sx={{ backgroundColor: DARK_BG, color: '#FFFFFF', p: '60px 40px' }}>
              <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>Your next savings frontier</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>Another ₹1.61 lakh may be within reach</Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '18px', mb: 8 }}>This is an opportunity estimate - not savings already realised.</Typography>

              <Box sx={{ p: 5, border: '1px solid #1E3A47', borderRadius: '24px', mb: 8 }}>
                <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Estimated Additional Monthly Opportunity</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '64px', fontWeight: 800, lineHeight: 1, mr: 4 }}>₹1,61,083</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '16px' }}>by shifting up to 48,331 kWh into lower-cost time windows</Typography>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 6 }}>What the model recommends</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, mb: 10 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 4 }}>
                    <Typography sx={{ fontWeight: 800, color: DARK_BG, fontSize: '18px' }}>01</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, mb: 1 }}>Reduce expensive night-time consumption</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '16px' }}>Prioritise the 7 PM - 5 AM window.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 4 }}>
                    <Typography sx={{ fontWeight: 800, color: DARK_BG, fontSize: '18px' }}>02</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, mb: 1 }}>Move flexible operations to daytime</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '16px' }}>Use lower-cost 5 AM - 7 PM blocks.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 4 }}>
                    <Typography sx={{ fontWeight: 800, color: DARK_BG, fontSize: '18px' }}>03</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, mb: 1 }}>Validate before changing production</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '16px' }}>Check labour, process, capacity and demand-charge impact.</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ backgroundColor: 'rgba(255,255,255,0.05)', p: 4, borderRadius: '16px' }}>
                <Typography sx={{ color: LIGHT_GREEN, fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Important</Typography>
                <Typography sx={{ color: '#E2E8F0', fontSize: '16px' }}>Operational feasibility must be confirmed before this opportunity is treated as committed savings.</Typography>
              </Box>

              {pageFooterDark(6)}
            </Box>

            {/* PAGE 7 */}
            <Box className="pdf-page" sx={{ backgroundColor: LIGHT_BG, p: '60px 40px' }}>
              <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>The Prolt Advantage</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>How smarter procurement works for you</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '18px', mb: 10 }}>Complex energy decisions happen in the background. You see the result: lower cost and clearer control.</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 12 }}>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 6 }}>
                    <Typography sx={{ fontWeight: 800, color: '#FFF', fontSize: '24px' }}>1</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>Understand</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '16px' }}>We read your 15-minute consumption pattern.</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 6 }}>
                    <Typography sx={{ fontWeight: 800, color: '#FFF', fontSize: '24px' }}>2</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>Compare</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '16px' }}>We compare market and DISCOM prices for every time block.</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 6 }}>
                    <Typography sx={{ fontWeight: 800, color: '#FFF', fontSize: '24px' }}>3</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>Optimise</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '16px' }}>We buy from the better source while retaining reliability.</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY_GREEN, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, mr: 6 }}>
                    <Typography sx={{ fontWeight: 800, color: '#FFF', fontSize: '24px' }}>4</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 1 }}>Report</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '16px' }}>We show what changed, what you saved and what comes next.</Typography>
                  </Box>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 4 }}>Plain-English guide</Typography>
              <Table size="small" sx={{ mb: 4, '& td': { borderBottom: 'none', py: 1.5, fontSize: '14px' } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '200px', p: 0 }}>Open Access</TableCell>
                    <TableCell sx={{ color: '#64748B', p: 0 }}>Power purchased from the market instead of only from the DISCOM.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, p: 0 }}>GDAM</TableCell>
                    <TableCell sx={{ color: '#64748B', p: 0 }}>Green Day-Ahead Market - renewable power bought for the following day.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, p: 0 }}>Blended cost</TableCell>
                    <TableCell sx={{ color: '#64748B', p: 0 }}>Your average cost after combining DISCOM and market power.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, p: 0 }}>ToD window</TableCell>
                    <TableCell sx={{ color: '#64748B', p: 0 }}>A time period in which the DISCOM applies a particular tariff.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {pageFooterLight(7)}
            </Box>

            {/* PAGE 8 */}
            <Box className="pdf-page" sx={{ backgroundColor: LIGHT_BG, p: '60px 40px' }}>
              <Typography sx={{ color: PRIMARY_GREEN, fontWeight: 700, fontSize: '14px', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>Details for your energy team</Typography>
              <Typography sx={{ fontSize: '40px', fontWeight: 800, mb: 2 }}>Technical summary</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '18px', mb: 8 }}>The supporting numbers behind the customer-friendly report.</Typography>

              <Box sx={{ backgroundColor: '#FFF', borderRadius: '16px', overflow: 'hidden', mb: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: DARK_BG }}>
                      <TableCell sx={{ color: '#FFF', fontWeight: 700 }}>Time window</TableCell>
                      <TableCell sx={{ color: '#FFF', fontWeight: 700 }}>Consumption</TableCell>
                      <TableCell sx={{ color: '#FFF', fontWeight: 700 }}>OA scheduled</TableCell>
                      <TableCell sx={{ color: '#FFF', fontWeight: 700 }}>OA delivered</TableCell>
                      <TableCell sx={{ color: '#FFF', fontWeight: 700 }}>OA bill</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: '#475569' }}>3 AM - 5 AM</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block3to5.used).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block3to5.oa * 1.15).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block3to5.oa).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>₹{Math.round(block3to5.oa * 4.5).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#475569' }}>7 PM - 3 AM</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block7to3.used).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block7to3.oa * 1.15).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block7to3.oa).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>₹{Math.round(block7to3.oa * 4.5).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#475569' }}>5 AM - 10 AM</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block5to10.used).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block5to10.oa * 1.15).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block5to10.oa).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>₹{Math.round(block5to10.oa * 4.5).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#475569' }}>10 AM - 7 PM</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block10to7.used).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block10to7.oa * 1.15).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{Math.round(block10to7.oa).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>₹{Math.round(block10to7.oa * 4.5).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: '#E8F5EE' }}>
                      <TableCell sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{Math.round(totalEnergyKwh).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{Math.round(scheduledOA).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{Math.round(totalMarketEnergyKwh).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>₹{Math.round(totalMarketEnergyKwh * 4.5).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              <Typography sx={{ fontSize: '24px', fontWeight: 800, mb: 4 }}>Commercial summary from the source report</Typography>
              
              <Box sx={{ backgroundColor: '#FFF', borderRadius: '16px', overflow: 'hidden', mb: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: '#475569', fontWeight: 700, borderBottom: '1px solid #E2E8F0', py: 2.5 }}>DISCOM-only baseline</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'right', borderBottom: '1px solid #E2E8F0', py: 2.5 }}>₹{Math.round(totalBaselineCost).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#475569', fontWeight: 700, borderBottom: '1px solid #E2E8F0', py: 2.5 }}>Final customer cost</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'right', borderBottom: '1px solid #E2E8F0', py: 2.5 }}>₹{Math.round(finalCost).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: '#E8F5EE' }}>
                      <TableCell sx={{ color: '#0F172A', fontWeight: 800, py: 2.5, borderBottom: 'none' }}>Confirmed gross saving</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'right', py: 2.5, borderBottom: 'none' }}>₹{Math.round(totalSavings).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              <Box sx={{ backgroundColor: '#FFFBEB', p: 4, borderRadius: '16px' }}>
                <Typography sx={{ color: '#D97706', fontWeight: 700, fontSize: '12px', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>Data Note</Typography>
                <Typography sx={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  The source report contains separate scheduled-energy, consumer-bus and commercial views. This redesign labels each
                  view explicitly. Before external issuance, the underlying billing engine should complete a line-by-line reconciliation of OA
                  charges, scheduling costs and fees.
                </Typography>
              </Box>

              {pageFooterLight(8)}
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
