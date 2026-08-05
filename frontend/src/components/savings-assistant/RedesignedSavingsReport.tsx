import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const RedesignedSavingsReport: React.FC<{ calcEntry: any; allResults: { month: string; marketDecisionResult: any }[] }> = ({ calcEntry, allResults }) => {
  const { assumptions } = calcEntry;
  const clientName = calcEntry.clientName || 'Client';

  return (
    <Box className="redesigned-pdf-report" sx={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}>
      {allResults.map((resultObj, index) => {
        const { month, marketDecisionResult } = resultObj;
        
        const totalSavings = marketDecisionResult?.totalSavings || 0;
        const totalBaselineCost = marketDecisionResult?.totalBaselineCost || 0;
        const totalEnergyKwh = marketDecisionResult?.totalEnergyKwh || 0;
        const totalMarketEnergyKwh = marketDecisionResult?.totalMarketEnergyKwh || 0;
        
        const finalCost = totalBaselineCost - totalSavings;
        const savingsPercentage = totalBaselineCost > 0 ? (totalSavings / totalBaselineCost) * 100 : 0;

        // Data for Pie Chart
        const pieData = [
          { name: 'Open Access', value: totalMarketEnergyKwh },
          { name: 'DISCOM', value: totalEnergyKwh - totalMarketEnergyKwh }
        ];
        const COLORS = ['#2E51FF', '#94A3B8'];

        // Data for TOD Chart
        const todData = marketDecisionResult?.todSummaries?.map((t: any) => ({
          name: t.todName,
          baselineCost: t.totalBaselineCost,
          finalCost: t.totalBaselineCost - t.totalSavings,
          savings: t.totalSavings
        })) || [];

        // Data for OA Breakdown
        const oaBreakdown = marketDecisionResult?.oaDetailed?.breakdown?.length > 0 
          ? marketDecisionResult.oaDetailed.breakdown.map((b: any) => ({
              name: 'OA Components',
              energyCost: b.energyCost || 0,
              transmission: b.stuTransmissionCharges || 0,
              losses: b.transmissionLossCost || 0,
              others: (b.totalLandedExchangeCost || 0) - (b.energyCost || 0) - (b.stuTransmissionCharges || 0) - (b.transmissionLossCost || 0)
            }))
          : [];

        const dailyDataMap: Record<string, { baseline: number; final: number; day: string }> = {};
        marketDecisionResult?.slotsData?.forEach((s: any) => {
          if (!s || !s.date) return;
          const dateStr = s.date.substring(0, 10);
          if (!dailyDataMap[dateStr]) {
            dailyDataMap[dateStr] = { baseline: 0, final: 0, day: dateStr.split('-')[2] || dateStr };
          }
          dailyDataMap[dateStr].baseline += s.baselineCost || 0;
          dailyDataMap[dateStr].final += s.totalCost || 0;
        });
        const timelineData = Object.values(dailyDataMap).sort((a, b) => a.day.localeCompare(b.day));

        const monthLabel = month === 'all' ? 'Overall Summary' : month;

        return (
          <React.Fragment key={month}>
            {/* PAGE 1 */}
            <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ textTransform: 'uppercase', mb: 2, color: '#64748B', fontSize: '18px', fontWeight: 600 }}>
                  {assumptions?.analysisYear || new Date().getFullYear()} - {monthLabel}
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
                    ₹{Math.round(totalSavings).toLocaleString('en-IN')}
                  </Typography>
                  <Typography sx={{ color: '#64748B', fontSize: '16px' }}>saved in this period</Typography>
                </Box>
                <Box>
                  <Typography sx={{ textTransform: 'uppercase', color: '#64748B', fontWeight: 600, mb: 1, letterSpacing: 1 }}>Saving On Your Baseline Bill</Typography>
                  <Typography sx={{ fontSize: '36px', color: '#0284C7', fontWeight: 800 }}>
                    {savingsPercentage.toFixed(1)}%
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
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>Page {index * 6 + 1}</Typography>
              </Box>
            </Box>

            {/* PAGE 2 */}
            <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
              <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>THE MONTH IN ONE GLANCE ({monthLabel})</Typography>
              <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>What Prolt delivered for you</Typography>
              <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>Your key energy and savings results, without the technical clutter.</Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 6 }}>
                <Box sx={{ p: 4, backgroundColor: '#F0FDF4', borderRadius: 3 }}>
                  <Typography sx={{ color: '#166534', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Your Confirmed Savings</Typography>
                  <Typography sx={{ color: '#15803D', fontWeight: 800, fontSize: '28px' }}>₹{(Math.round(totalSavings/1000)/100).toFixed(2)} lakh</Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#F0F9FF', borderRadius: 3 }}>
                  <Typography sx={{ color: '#0369A1', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Savings Per Unit</Typography>
                  <Typography sx={{ color: '#0284C7', fontWeight: 800, fontSize: '28px' }}>
                    ₹{(totalSavings / (totalEnergyKwh || 1)).toFixed(2)} / kWh
                  </Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3 }}>
                  <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Your Final Blended Cost</Typography>
                  <Typography sx={{ color: '#334155', fontWeight: 800, fontSize: '28px' }}>
                    ₹{(finalCost / (totalEnergyKwh || 1)).toFixed(2)} / kWh
                  </Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3 }}>
                  <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Total Electricity Used</Typography>
                  <Typography sx={{ color: '#334155', fontWeight: 800, fontSize: '28px' }}>{Math.round(totalEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', p: 4, backgroundColor: '#F8FAFC', borderRadius: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '18px' }}>THE TAKEAWAY</Typography>
                <Typography sx={{ fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>
                  Prolt reduced your electricity cost by nearly ₹{(Math.round(totalSavings/1000)/100).toFixed(2)} lakh.
                  That is a {savingsPercentage.toFixed(1)}% reduction compared with buying the same electricity entirely from the DISCOM.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>Page {index * 6 + 2}</Typography>
              </Box>
            </Box>

            {/* PAGE 3: POWER MIX */}
            <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
              <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>YOUR POWER MIX ({monthLabel})</Typography>
              <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>Where your electricity came from</Typography>
              <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>We combined Open Access market power with DISCOM supply to lower your overall cost.</Typography>

              <Box sx={{ height: 400, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie isAnimationActive={false} data={pieData} cx="50%" cy="50%" innerRadius={100} outerRadius={140} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${Math.round(value).toLocaleString('en-IN')} kWh`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ mt: 'auto', mb: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3, borderLeft: '4px solid #2E51FF' }}>
                  <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>OPEN ACCESS DELIVERED</Typography>
                  <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '28px' }}>{Math.round(totalMarketEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: '14px', mt: 1 }}>Clean market power reaching your facility</Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#F8FAFC', borderRadius: 3, borderLeft: '4px solid #94A3B8' }}>
                  <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>BALANCE FROM DISCOM</Typography>
                  <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '28px' }}>{Math.round(totalEnergyKwh - totalMarketEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: '14px', mt: 1 }}>Reliable supply retained for uncovered demand</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>Page {index * 6 + 3}</Typography>
              </Box>
            </Box>

            {/* PAGE 4: SAVINGS TIMELINE */}
            <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
              <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>SAVINGS TIMELINE ({monthLabel})</Typography>
              <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>Daily Cost Comparison</Typography>
              <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>How your final costs tracked against the baseline every day.</Typography>

              <Box sx={{ height: 400, width: '100%' }}>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value: number) => `₹${Math.round(value).toLocaleString()}`} />
                      <Legend iconType="circle" />
                      <Bar isAnimationActive={false} dataKey="baseline" name="Baseline Cost" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      <Bar isAnimationActive={false} dataKey="final" name="Final Cost" fill="#16A34A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography sx={{color: '#94A3B8', textAlign: 'center', mt: 10}}>No daily slot data available for {monthLabel}</Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>Page {index * 6 + 4}</Typography>
              </Box>
            </Box>

            {/* PAGE 5: TOD ANALYSIS */}
            <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
              <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>TIME OF DAY ANALYSIS ({monthLabel})</Typography>
              <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>Savings by block</Typography>
              <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>Which hours of the day contributed most to your savings.</Typography>

              <Box sx={{ height: 400, width: '100%' }}>
                {todData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={todData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value: number) => `₹${Math.round(value).toLocaleString()}`} />
                      <Legend iconType="circle" />
                      <Bar isAnimationActive={false} dataKey="baselineCost" name="Baseline Cost" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      <Bar isAnimationActive={false} dataKey="finalCost" name="Final Cost" fill="#2E51FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography sx={{color: '#94A3B8', textAlign: 'center', mt: 10}}>No TOD breakdown available for {monthLabel}</Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>Page {index * 6 + 5}</Typography>
              </Box>
            </Box>

            {/* PAGE 6: OA BREAKDOWN */}
            <Box className="pdf-page" sx={{ display: 'flex', flexDirection: 'column', p: 8, height: '100%' }}>
              <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontSize: '24px', textTransform: 'uppercase' }}>COST BREAKDOWN ({monthLabel})</Typography>
              <Typography sx={{ color: '#334155', mb: 1, fontSize: '20px', fontWeight: 600 }}>Open Access Components</Typography>
              <Typography sx={{ color: '#64748B', mb: 8, fontSize: '16px' }}>Detailed breakdown of landed cost components for OA power.</Typography>

              <Box sx={{ height: 400, width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                {oaBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={oaBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={100}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value: number) => `₹${Math.round(value).toLocaleString()}`} />
                      <Legend iconType="circle" />
                      <Bar isAnimationActive={false} dataKey="energyCost" stackId="a" name="Energy Cost" fill="#2E51FF" />
                      <Bar isAnimationActive={false} dataKey="transmission" stackId="a" name="Transmission" fill="#0284C7" />
                      <Bar isAnimationActive={false} dataKey="losses" stackId="a" name="Losses" fill="#0EA5E9" />
                      <Bar isAnimationActive={false} dataKey="others" stackId="a" name="Other Fees" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography sx={{color: '#94A3B8', textAlign: 'center', mt: 10}}>No OA component breakdown available for {monthLabel}</Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px', letterSpacing: 1 }}>PROLT ENERGY | ENERGY PROCUREMENT INTELLIGENCE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '12px' }}>Page {index * 6 + 6}</Typography>
              </Box>
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
