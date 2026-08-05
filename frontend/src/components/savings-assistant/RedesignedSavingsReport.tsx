import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const RedesignedSavingsReport: React.FC<{ calcEntry: any; allResults: { month: string; marketDecisionResult: any }[] }> = ({ calcEntry, allResults }) => {
  const { assumptions } = calcEntry;
  const clientName = calcEntry.clientName || 'Client';

  return (
    <Box className="redesigned-pdf-report" sx={{ backgroundColor: '#FFFFFF', color: '#0F172A', fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif' }}>
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
          name: t.slabName || 'Unknown',
          baselineCost: t.baselineCost || 0,
          finalCost: (t.baselineCost || 0) - (t.savings || 0),
          savings: t.savings || 0
        })) || [];

        // Data for OA Breakdown
        const oaBreakdown = marketDecisionResult?.oaDetailed?.breakdown?.length > 0 
          ? marketDecisionResult.oaDetailed.breakdown.map((b: any) => ({
              name: b.slabName || 'Unknown',
              oaBill: b.oaBill || 0,
              proltDiscomBill: b.proltDiscomBill || 0
            }))
          : [];

        const dailyDataMap: Record<string, { baseline: number; final: number; day: string }> = {};
        marketDecisionResult?.slotsData?.forEach((s: any) => {
          if (!s || !s.date) return;
          const dateStr = s.date.substring(0, 10);
          if (!dailyDataMap[dateStr]) {
            dailyDataMap[dateStr] = { baseline: 0, final: 0, day: dateStr.split('-')[2] || dateStr };
          }
          const marketQty = s.marketEnergy || 0;
          const discomQty = s.discomEnergy || 0;
          const totalQty = marketQty + discomQty;
          
          const baselineCost = totalQty * (s.discomLanding || 0);
          const finalCost = (marketQty * (s.bestMarketLanding || 0)) + (discomQty * (s.discomLanding || 0));

          dailyDataMap[dateStr].baseline += baselineCost;
          dailyDataMap[dateStr].final += finalCost;
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
                <Box sx={{ p: 4, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #16A34A, #22C55E)' }} />
                  <Typography sx={{ color: '#166534', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Your Confirmed Savings</Typography>
                  <Typography sx={{ color: '#15803D', fontWeight: 800, fontSize: '28px' }}>₹{(Math.round(totalSavings/1000)/100).toFixed(2)} lakh</Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #0284C7, #0EA5E9)' }} />
                  <Typography sx={{ color: '#0369A1', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Savings Per Unit</Typography>
                  <Typography sx={{ color: '#0284C7', fontWeight: 800, fontSize: '28px' }}>
                    ₹{(totalSavings / (totalEnergyKwh || 1)).toFixed(2)} / kWh
                  </Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)' }}>
                  <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Your Final Blended Cost</Typography>
                  <Typography sx={{ color: '#334155', fontWeight: 800, fontSize: '28px' }}>
                    ₹{(finalCost / (totalEnergyKwh || 1)).toFixed(2)} / kWh
                  </Typography>
                </Box>
                <Box sx={{ p: 4, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)' }}>
                  <Typography sx={{ color: '#475569', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '12px', letterSpacing: 1 }}>Total Electricity Used</Typography>
                  <Typography sx={{ color: '#334155', fontWeight: 800, fontSize: '28px' }}>{Math.round(totalEnergyKwh).toLocaleString('en-IN')} kWh</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', p: 4, backgroundColor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
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
                    <defs>
                      <linearGradient id="colorOa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#1D4ED8" stopOpacity={1}/>
                      </linearGradient>
                      <linearGradient id="colorDiscom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#64748B" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <Pie isAnimationActive={false} data={pieData} cx="50%" cy="50%" innerRadius={105} outerRadius={145} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={i === 0 ? "url(#colorOa)" : "url(#colorDiscom)"} style={{ filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.1))` }} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${Math.round(value).toLocaleString('en-IN')} kWh`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
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
                    <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={16}>
                      <defs>
                        <linearGradient id="barBaseline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#64748B" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="barFinal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={{stroke: '#E2E8F0'}} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#64748B', fontSize: 12}} dx={-10} />
                      <Tooltip cursor={{fill: 'rgba(226, 232, 240, 0.4)'}} formatter={(value: number) => `₹${Math.round(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar isAnimationActive={false} dataKey="baseline" name="Baseline Cost" fill="url(#barBaseline)" radius={[6, 6, 0, 0]} />
                      <Bar isAnimationActive={false} dataKey="final" name="Final Cost" fill="url(#barFinal)" radius={[6, 6, 0, 0]} />
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
                    <BarChart data={todData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={32}>
                      <defs>
                        <linearGradient id="todBaseline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#64748B" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="todFinal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#1D4ED8" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={{stroke: '#E2E8F0'}} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#64748B', fontSize: 12}} dx={-10} />
                      <Tooltip cursor={{fill: 'rgba(226, 232, 240, 0.4)'}} formatter={(value: number) => `₹${Math.round(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar isAnimationActive={false} dataKey="baselineCost" name="Baseline Cost" fill="url(#todBaseline)" radius={[8, 8, 0, 0]} />
                      <Bar isAnimationActive={false} dataKey="finalCost" name="Final Cost" fill="url(#todFinal)" radius={[8, 8, 0, 0]} />
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
                    <BarChart data={oaBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={48}>
                      <defs>
                        <linearGradient id="stackOa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#1D4ED8" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="stackDiscom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#0369A1" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={{stroke: '#E2E8F0'}} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#64748B', fontSize: 12}} dx={-10} />
                      <Tooltip cursor={{fill: 'rgba(226, 232, 240, 0.4)'}} formatter={(value: number) => `₹${Math.round(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar isAnimationActive={false} dataKey="oaBill" stackId="a" name="OA Bill" fill="url(#stackOa)" />
                      <Bar isAnimationActive={false} dataKey="proltDiscomBill" stackId="a" name="Prolt DISCOM Bill" fill="url(#stackDiscom)" radius={[8, 8, 0, 0]} />
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
