import React from 'react';
import { Box, Typography, Grid, Card, CardContent, LinearProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { PersonOutline, ReceiptLong, ShowChart, AccountBalanceWallet, Speed, ExpandMore } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { SavingsCalculatorEntry, ClientOverviewResult } from '../../api/savingsCalculator.api';

interface WithoutProltTabProps {
  entry: SavingsCalculatorEntry;
  overview: ClientOverviewResult;
  currentMonth: string;
}

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return "N/A";
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function WithoutProltTab({ entry, overview, currentMonth }: WithoutProltTabProps) {
  // Map ToD Consumptions for the current month if available
  const monthData = entry.todConsumptions?.[currentMonth] || {};
  const dynamicConsumptionData = Object.entries(monthData).map(([slab, val]) => ({
    name: slab,
    value: Number(val) || 0
  })).filter(d => d.value > 0);

  // Fallback to mock data if no ToD consumption data exists
  const chartData = dynamicConsumptionData.length > 0 ? dynamicConsumptionData : [
    { name: 'ToD1 (Off Peak)', value: 125000 },
    { name: 'ToD2 (Normal)', value: 200000 },
    { name: 'ToD3 (Peak)', value: 125000 },
    { name: 'ToD4 (Normal)', value: 50000 },
  ];

  const netCurrentBill = overview?.aggregatedCosts?.totalDiscomCost || 0;
  const arrearAmount = entry.arrearAmount || 0;
  const currentLpsc = entry.currentLpsc || 0;
  const totalBill = netCurrentBill + arrearAmount + currentLpsc;

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      
      {/* Main Content (Left) */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Consumer & Connection Details */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PersonOutline color="primary" />
            <Typography variant="h6" fontWeight={700} color="text.primary">Consumer & Connection Details</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Who is this consumer and what is their connection?</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><DetailCard label="Account Number" value={entry.id.substring(0, 8).toUpperCase()} icon="tag" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Consumer Name" value={entry.clientName} icon="person" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Address" value={entry.address || "N/A"} icon="location" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Tariff" value={entry.consumerCategory || "N/A"} icon="receipt" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="State Code" value={entry.stateCode || "N/A"} icon="bolt" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="DISCOM" value={entry.discom || "N/A"} icon="speed" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Industry" value={entry.industryName || "N/A"} icon="tag" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Sanctioned Load" value={entry.sanctionedLoadKw ? `${entry.sanctionedLoadKw} kW` : "N/A"} icon="bolt" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Billed Demand" value={entry.billedDemandKv ? `${entry.billedDemandKv} kVA` : "N/A"} icon="bolt" /></Grid>
            <Grid item xs={6} md={3}><DetailCard label="Power Factor" value={entry.powerFactor ? `${entry.powerFactor}` : "N/A"} icon="show_chart" /></Grid>
          </Grid>
        </Box>

        {/* Billing Summary */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ReceiptLong color="primary" />
            <Typography variant="h6" fontWeight={700} color="text.primary">Billing Summary</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>What is the bill and what are its components?</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}><SummaryCard label="Bill Month" value={currentMonth} /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Bill Date" value={entry.billDate || "N/A"} /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Billed Units" value={`${chartData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()} kWh`} /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Amount Payable" value={formatCurrency(totalBill)} highlight /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Energy Charges" value="View Breakdown" /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Misc Charges" value="View Breakdown" /></Grid>
            <Grid item xs={12} md={4.8}><SummaryCard label="Net Current Bill" value={formatCurrency(netCurrentBill)} /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Arrear Amount" value={formatCurrency(entry.arrearAmount)} /></Grid>
            <Grid item xs={12} md={2.4}><SummaryCard label="Current LPSC" value={formatCurrency(entry.currentLpsc)} /></Grid>
          </Grid>
        </Box>

        {/* DISCOM Consumption Breakdown */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ShowChart color="primary" />
            <Typography variant="h6" fontWeight={700} color="text.primary">DISCOM Consumption Breakdown</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Where is consumption happening?</Typography>
          
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* 2-Column Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AccountBalanceWallet color="error" />
                <Typography variant="h6" fontWeight={700} color="text.primary">Where Your Money Went This Month</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Breakdown of all charges in your DISCOM bill</Typography>
              
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <BreakdownRow label="Energy Charges" percentage={42.0} amount="14.70L" color="#3B82F6" />
                    <BreakdownRow label="Demand & Fixed" percentage={22.0} amount="7.70L" color="#3B82F6" />
                    <BreakdownRow label="Penalties & Adjustments" percentage={11.0} amount="3.85L" color="#3B82F6" />
                    <BreakdownRow label="Miscellaneous" percentage={25.0} amount="8.75L" color="#3B82F6" />
                  </Box>
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" fontWeight={700}>Total Bill</Typography>
                    <Typography variant="h6" fontWeight={800}>{formatCurrency(totalBill)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Speed color="error" />
                <Typography variant="h6" fontWeight={700} color="text.primary">Are You Paying Too Much Fixed Charge?</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sanctioned load utilization analysis</Typography>
              
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  {/* Gauge Mockup */}
                  <Box sx={{ width: 200, height: 100, position: 'relative', overflow: 'hidden', mb: 2 }}>
                    <Box sx={{ width: 200, height: 200, borderRadius: '50%', border: '20px solid #E5E7EB', borderTopColor: '#22C55E', borderLeftColor: '#22C55E', transform: 'rotate(45deg)', position: 'absolute', top: 0, left: 0 }} />
                    <Typography variant="h4" fontWeight={800} color="success.main" sx={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center' }}>75%</Typography>
                    <Typography variant="caption" fontWeight={700} color="success.main" sx={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center' }}>Optimal</Typography>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Sanctioned Load</Typography>
                        <Typography variant="body1" fontWeight={800}>{entry.sanctionedLoadKw ? `${entry.sanctionedLoadKw} kW` : 'N/A'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Est. Max Demand</Typography>
                        <Typography variant="body1" fontWeight={800}>1875.00 kVA</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2, textAlign: 'center', width: '100%', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Monthly Fixed Charge</Typography>
                    <Typography variant="body1" fontWeight={800}>₹8750.00L</Typography>
                    <Typography variant="caption" color="text.secondary">@ ₹350/kVA</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Detailed Bill Information */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>Detailed Bill Information</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Expand sections for meter readings, calculations, and charges</Typography>
          
          <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>Meter Details</AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">Detailed breakdown of meter readings goes here...</Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>ToD Calculation Details</AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">Time of day calculation breakdown goes here...</Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 600 }}>Connection Details</AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">Additional connection parameters go here...</Typography>
            </AccordionDetails>
          </Accordion>
        </Box>

      </Box>

      {/* Side Column (Right) */}
      <Box sx={{ width: 320, display: { xs: 'none', lg: 'block' } }}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: '#E2E8F0', borderRadius: 3, bgcolor: '#F8FAFC' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="primary" fontWeight={700}>ONBOARDING IN PROGRESS</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ bgcolor: '#CBD5E1', color: 'white', px: 1, py: 0.25, borderRadius: 4, fontSize: '0.65rem', fontWeight: 800 }}>Step 3/8</Box>
            </Box>
            <Typography variant="subtitle2" fontWeight={800}>Document Collecti...</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Upload your KYC documents to proceed.</Typography>
            <LinearProgress variant="determinate" value={37.5} sx={{ height: 6, borderRadius: 3, mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Immediate — upl...</Typography>
              <Typography variant="caption" color="primary" fontWeight={600} sx={{ cursor: 'pointer' }}>View Details →</Typography>
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, fontSize: '0.65rem' }}>Ticket: PROLT-ONBD-2305</Typography>
          </CardContent>
        </Card>
      </Box>

    </Box>
  );
}

// Helper components
const DetailCard = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
        <Typography variant="caption" fontWeight={600}>{label}</Typography>
      </Box>
      <Typography variant="body2" fontWeight={800}>{value}</Typography>
    </CardContent>
  </Card>
);

const SummaryCard = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <Card elevation={0} sx={{ border: highlight ? '1px solid #93C5FD' : '1px solid', borderColor: highlight ? '#93C5FD' : 'divider', borderRadius: 2, height: '100%', bgcolor: highlight ? '#EFF6FF' : 'white' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: highlight ? 'primary.main' : 'text.secondary' }}>
        <Typography variant="caption" fontWeight={600}>{label}</Typography>
      </Box>
      <Typography variant="body1" fontWeight={800} color={highlight ? 'primary.main' : 'text.primary'}>{value}</Typography>
    </CardContent>
  </Card>
);

const BreakdownRow = ({ label, percentage, amount, color }: { label: string, percentage: number, amount: string, color: string }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary">{percentage.toFixed(1)}%</Typography>
        <Typography variant="body2" fontWeight={800}>₹{amount}</Typography>
      </Box>
    </Box>
    <LinearProgress variant="determinate" value={percentage} sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
  </Box>
);
