import React, { useMemo, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, Button } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { MarketDecisionResult } from '../../api/savingsCalculator.api';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import DownloadIcon from '@mui/icons-material/Download';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { useRef } from 'react';

interface SavingsDashboardProps {
  result: MarketDecisionResult;
  monthStr: string; // e.g. "2026-07"
}

export const SavingsDashboard: React.FC<SavingsDashboardProps> = ({ result, monthStr }) => {
  const [activeTab, setActiveTab] = useState<'overall' | 'monthly'>('overall');
  const [purchaseMode, setPurchaseMode] = useState<'actual' | 'recommended'>('recommended');
  const [isDownloading, setIsDownloading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      setIsDownloading(true);
      // Wait for React to render both tabs and full table
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin:       [25, 10, 50, 10] as [number, number, number, number], // Top, Right, Bottom, Left margin in mm
        filename:     `Savings_Dashboard_${monthStr}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // 1. Generate PDF as ArrayBuffer
      const pdfArrayBuffer = await html2pdf().set(opt).from(dashboardRef.current).output('arraybuffer');
      
      // 2. Fetch Letterhead PDF
      const letterheadRes = await fetch('/Minimalist_Business_Letterhead.pdf');
      const letterheadBuffer = await letterheadRes.arrayBuffer();

      // 3. Merge them using pdf-lib
      const mergedPdf = await PDFDocument.create();
      const letterheadPdf = await PDFDocument.load(letterheadBuffer);
      const generatedPdf = await PDFDocument.load(pdfArrayBuffer);

      const [letterheadPage] = await mergedPdf.embedPdf(letterheadPdf, [0]);
      const generatedPages = generatedPdf.getPages();
      const embeddedGeneratedPages = await mergedPdf.embedPdf(generatedPdf, generatedPages.map((_, i) => i));

      for (let i = 0; i < embeddedGeneratedPages.length; i++) {
        const page = mergedPdf.addPage([letterheadPage.width, letterheadPage.height]);
        
        // Draw the letterhead as the background
        page.drawPage(letterheadPage, {
          x: 0,
          y: 0,
          width: letterheadPage.width,
          height: letterheadPage.height
        });

        // Draw the generated content over it
        page.drawPage(embeddedGeneratedPages[i], {
          x: 0,
          y: 0,
          width: letterheadPage.width,
          height: letterheadPage.height
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      
      // 4. Trigger download
      // @ts-ignore
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Savings_Dashboard_${monthStr}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Aggregate daily data
  const dailyData = useMemo(() => {
    const days: Record<string, any> = {};
    const slots = result.slotsData || [];
    
    // Calculate energy per slot
    // We assume the total energy is evenly distributed over the month's slots
    const totalSlots = slots.length || 1;
    const energyPerSlot = result.totalEnergyKwh / totalSlots;

    slots.forEach((slot: any) => {
      const dateKey = slot.date;
      if (!days[dateKey]) {
        days[dateKey] = {
          date: dateKey,
          dayLabel: `${Number(dateKey.substring(8, 10))}`,
          totalUnits: 0,
          oaUnits: 0,
          discomUnits: 0,
          actualSpend: 0,
          proltSpend: 0,
          savings: 0,
          actualDiscomUnits: 0, // all units
          damUnits: 0,
          rtmUnits: 0,
          gdamUnits: 0,
          hpDamUnits: 0,
        };
      }
      
      // Use exact slot energies if available, otherwise fallback
      const marketEnergy = slot.marketEnergy || 0;
      const discomEnergy = slot.discomEnergy || 0;
      let totalSlotEnergy = marketEnergy + discomEnergy;
      if (totalSlotEnergy === 0) {
        totalSlotEnergy = energyPerSlot;
      }
      
      days[dateKey].totalUnits += totalSlotEnergy;
      days[dateKey].actualDiscomUnits += totalSlotEnergy;
      
      const discomCostForSlot = totalSlotEnergy * slot.discomLanding;
      days[dateKey].actualSpend += discomCostForSlot;
      
      if (slot.shouldBuyFromMarket && slot.bestMarketLanding > 0) {
        days[dateKey].oaUnits += totalSlotEnergy;
        days[dateKey].proltSpend += totalSlotEnergy * slot.bestMarketLanding;
        
        if (slot.marketSource === 'DAM') days[dateKey].damUnits += totalSlotEnergy;
        else if (slot.marketSource === 'GDAM') days[dateKey].gdamUnits += totalSlotEnergy;
        else if (slot.marketSource === 'RTM') days[dateKey].rtmUnits += totalSlotEnergy;
        else if (slot.marketSource === 'HP-DAM') days[dateKey].hpDamUnits += totalSlotEnergy;
        // fallback if missing
        else days[dateKey].damUnits += totalSlotEnergy; 

      } else {
        days[dateKey].discomUnits += totalSlotEnergy;
        days[dateKey].proltSpend += discomCostForSlot;
      }
    });

    // Calculate net spend including overheads to scale daily values correctly
    const netProltSpend = result.totalLandedExchangeCost 
      + (result.oaDetailed?.dailyFixedOverhead || 0) 
      + (result.oaDetailed?.bidApplicationFees || 0);

    // Scale daily prolt spend to match netProltSpend
    const rawTotalProlt = Object.values(days).reduce((acc: number, cur: any) => acc + cur.proltSpend, 0);
    const scaleFactor = rawTotalProlt > 0 ? (netProltSpend / rawTotalProlt) : 1;

    // Scale actual spend to match totalBaselineCost
    const rawTotalActual = Object.values(days).reduce((acc: number, cur: any) => acc + cur.actualSpend, 0);
    const actualScaleFactor = rawTotalActual > 0 ? (result.totalBaselineCost / rawTotalActual) : 1;

    Object.values(days).forEach((day: any) => {
      day.actualSpend = day.actualSpend * actualScaleFactor;
      day.proltSpend = day.proltSpend * scaleFactor;
      day.savings = day.actualSpend - day.proltSpend;
    });
    
    return Object.values(days).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [result]);

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)}L`; // Lakhs
  const formatThousands = (val: number) => `₹${(val / 1000).toFixed(2)}K`;

  // Calculate Net Prolt Spend and Net Savings
  const netProltSpend = result.totalLandedExchangeCost 
    + (result.oaDetailed?.dailyFixedOverhead || 0) 
    + (result.oaDetailed?.bidApplicationFees || 0);
    
  const netSavings = result.totalBaselineCost - netProltSpend;

  const savingsPerc = ((netSavings / result.totalBaselineCost) * 100).toFixed(2);
  
  const displayMonth = new Date(`${monthStr}-01`).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();

  const renderBanner = () => (
    <Box sx={{ 
      p: 4, 
      background: 'linear-gradient(to right, #EEF2FF, #E0E7FF)', 
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '1px solid #C7D2FE',
      mb: 3
    }}>
      <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        🎉 Great news! Your bill could drop by 
        <Typography component="span" variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          {netSavings >= 100000 ? formatCurrency(netSavings) : formatThousands(netSavings)}
        </Typography>
        <Typography component="span" variant="subtitle1" sx={{ color: '#3B82F6', fontWeight: 600 }}>
          ({savingsPerc}% reduction)
        </Typography>
      </Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
        Total potential savings for {displayMonth}.
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ bgcolor: 'white', px: 3, py: 1.5, borderRadius: 2, border: '1px solid #E5E7EB', minWidth: 150, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, letterSpacing: 1 }}>ACTUAL SPEND</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>{formatCurrency(result.totalBaselineCost)}</Typography>
        </Box>
        <ArrowRightAltIcon sx={{ color: '#9CA3AF' }} />
        <Box sx={{ bgcolor: '#ECFDF5', px: 3, py: 1.5, borderRadius: 2, border: '1px solid #A7F3D0', minWidth: 150, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, letterSpacing: 1 }}>PROLT OPTIMIZED SPEND</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#047857' }}>{formatCurrency(netProltSpend)}</Typography>
        </Box>
      </Box>
      
      <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 500 }}>
        Total Units : <strong style={{ color: '#111827' }}>{result.totalEnergyKwh.toLocaleString('en-IN')} kWh</strong> analyzed
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }} ref={dashboardRef}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: -1 }}>
        <Box data-html2canvas-ignore sx={{ display: 'flex', bgcolor: '#F3F4F6', p: 0.5, borderRadius: 8 }}>
          <Button 
            onClick={() => setActiveTab('overall')}
            sx={{ 
              borderRadius: 8, 
              px: 3, 
              py: 0.5, 
              textTransform: 'none', 
              fontWeight: 600,
              bgcolor: activeTab === 'overall' ? '#111827' : 'transparent',
              color: activeTab === 'overall' ? 'white' : '#6B7280',
              '&:hover': { bgcolor: activeTab === 'overall' ? '#111827' : 'rgba(0,0,0,0.04)' }
            }}
          >
            Overall Details
          </Button>
          <Button 
            onClick={() => setActiveTab('monthly')}
            sx={{ 
              borderRadius: 8, 
              px: 3, 
              py: 0.5, 
              textTransform: 'none', 
              fontWeight: 600,
              bgcolor: activeTab === 'monthly' ? '#111827' : 'transparent',
              color: activeTab === 'monthly' ? 'white' : '#6B7280',
              '&:hover': { bgcolor: activeTab === 'monthly' ? '#111827' : 'rgba(0,0,0,0.04)' }
            }}
          >
            Monthly Details
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {activeTab === 'monthly' && (
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, py: 1, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{displayMonth}</Typography>
            </Box>
          )}
          <Button
            variant="outlined"
            onClick={handleDownloadPDF}
            startIcon={<DownloadIcon />}
            disabled={isDownloading}
            data-html2canvas-ignore
            sx={{
              borderRadius: 8,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E5E7EB',
              color: '#374151',
              '&:hover': {
                bgcolor: '#F9FAFB',
                borderColor: '#D1D5DB'
              }
            }}
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </Box>
      </Box>

      {renderBanner()}

      {(activeTab === 'overall' || isDownloading) && (
        <>
          <Card variant="outlined" sx={{ borderRadius: 3, pageBreakInside: 'avoid' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <span style={{ color: '#3B82F6' }}>📈</span> Monthly Spend Comparison
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: displayMonth, Actual: result.totalBaselineCost, Prolt: netProltSpend }]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Actual" name="Actual Spend" fill="#EF4444" barSize={100} radius={[4, 4, 0, 0]} isAnimationActive={!isDownloading} />
                    <Bar dataKey="Prolt" name="Prolt Optimised Spend" fill="#10B981" barSize={100} radius={[4, 4, 0, 0]} isAnimationActive={!isDownloading} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, pageBreakInside: 'avoid' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <span style={{ color: '#8B5CF6' }}>📊</span> Monthly Consumption Mix - DISCOM Vs OA
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: displayMonth, 'Actual DISCOM': result.totalEnergyKwh, 'Actual OA': 0, 'Prolt Optimized DISCOM': result.totalEnergyKwh - result.totalMarketEnergyKwh, 'Prolt Optimized OA': result.totalMarketEnergyKwh }
                  ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => `${value.toLocaleString('en-IN')} kWh`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    
                    <Bar dataKey="Actual DISCOM" stackId="a" fill="#8B5CF6" barSize={40} isAnimationActive={!isDownloading} />
                    <Bar dataKey="Actual OA" stackId="a" fill="#F59E0B" barSize={40} isAnimationActive={!isDownloading} />
                    
                    <Bar dataKey="Prolt Optimized DISCOM" stackId="b" fill="#8B5CF6" barSize={40} isAnimationActive={!isDownloading} />
                    <Bar dataKey="Prolt Optimized OA" stackId="b" fill="#10B981" barSize={40} isAnimationActive={!isDownloading} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {(activeTab === 'monthly' || isDownloading) && (
        <>
          <Card variant="outlined" sx={{ borderRadius: 3, pageBreakInside: 'avoid' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <span style={{ color: '#3B82F6' }}>₹</span> Daily Savings Opportunity (Energy Cost)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dayLabel" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="actualSpend" name="Actual Spend" stroke="#EF4444" fillOpacity={0} isAnimationActive={!isDownloading} />
                    <Area type="monotone" dataKey="proltSpend" name="Prolt Optimized Spend" stroke="#3B82F6" fillOpacity={0} isAnimationActive={!isDownloading} />
                    <Area type="monotone" dataKey="savings" name="Saving Zone" stroke="#10B981" fill="url(#colorSavings)" isAnimationActive={!isDownloading} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, pageBreakInside: 'avoid' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ color: '#3B82F6' }}>📈</span> Purchase Comparison - {displayMonth}
                </Typography>
                <Box data-html2canvas-ignore sx={{ display: 'flex', bgcolor: '#F9FAFB', p: 0.5, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <Button 
                    onClick={() => setPurchaseMode('actual')}
                    sx={{ 
                      borderRadius: 8, 
                      px: 2, 
                      py: 0.5, 
                      textTransform: 'none', 
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: purchaseMode === 'actual' ? '#111827' : 'transparent',
                      color: purchaseMode === 'actual' ? 'white' : '#6B7280',
                      '&:hover': { bgcolor: purchaseMode === 'actual' ? '#111827' : 'rgba(0,0,0,0.04)' }
                    }}
                  >
                    How You Actually Purchased
                  </Button>
                  <Button 
                    onClick={() => setPurchaseMode('recommended')}
                    sx={{ 
                      borderRadius: 8, 
                      px: 2, 
                      py: 0.5, 
                      textTransform: 'none', 
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: purchaseMode === 'recommended' ? '#111827' : 'transparent',
                      color: purchaseMode === 'recommended' ? 'white' : '#6B7280',
                      '&:hover': { bgcolor: purchaseMode === 'recommended' ? '#111827' : 'rgba(0,0,0,0.04)' }
                    }}
                  >
                    How You Should Purchase <span style={{ color: '#10B981', marginLeft: 4, background: '#D1FAE5', padding: '2px 6px', borderRadius: 4, fontSize: '10px' }}>RECOMMENDED</span>
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dayLabel" tick={{fontSize: 10, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => `${value.toFixed(2)} units`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    {purchaseMode === 'actual' ? (
                      <Bar dataKey="actualDiscomUnits" name="DISCOM Energy" fill="#8B5CF6" barSize={12} radius={[4, 4, 0, 0]} isAnimationActive={!isDownloading} />
                    ) : (
                      <>
                        <Bar dataKey="discomUnits" name="DISCOM Energy" stackId="a" fill="#8B5CF6" barSize={12} isAnimationActive={!isDownloading} />
                        <Bar dataKey="damUnits" name="DAM" stackId="a" fill="#F59E0B" barSize={12} isAnimationActive={!isDownloading} />
                        <Bar dataKey="rtmUnits" name="RTM" stackId="a" fill="#EF4444" barSize={12} isAnimationActive={!isDownloading} />
                        <Bar dataKey="gdamUnits" name="GDAM" stackId="a" fill="#10B981" barSize={12} isAnimationActive={!isDownloading} />
                        <Bar dataKey="hpDamUnits" name="HP-DAM" stackId="a" fill="#3B82F6" barSize={12} isAnimationActive={!isDownloading} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              
              <Box sx={{ mt: 2, bgcolor: '#EEF2FF', borderRadius: 2, py: 1.5, textAlign: 'center', border: '1px solid #E0E7FF' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  Total Energy Cost Paid : {formatCurrency(purchaseMode === 'actual' ? result.totalBaselineCost : netProltSpend)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, pageBreakInside: 'avoid' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ color: '#3B82F6' }}>📅</span> Prolt Suggested Daily Breakdown
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: isDownloading ? 'none' : 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>Day</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>Total Units</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>OA Units</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>DISCOM Units</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>You Paid</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>Prolt Suggested</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: '#F9FAFB', color: '#6B7280' }}>Savings</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyData.map((row) => (
                      <TableRow key={row.date} hover sx={{ pageBreakInside: 'avoid' }}>
                        <TableCell sx={{ fontSize: '13px' }}>Day {row.dayLabel}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px' }}>{(row.totalUnits/1000).toFixed(2)}K</TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px' }}>{row.oaUnits > 0 ? row.oaUnits.toFixed(2) : '-'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>{row.discomUnits.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px' }}>{formatThousands(row.actualSpend)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px' }}>{formatThousands(row.proltSpend)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '13px', color: row.savings > 0 ? '#10B981' : 'inherit', fontWeight: row.savings > 0 ? 'bold' : 'normal' }}>
                          {formatThousands(row.savings)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, pageBreakInside: 'avoid' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <span style={{ color: '#3B82F6' }}>₹</span> Cost Vs Consumption
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, letterSpacing: 1, mb: 1 }}>CURRENT RATE</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
                      ₹{(result.totalBaselineCost / result.totalEnergyKwh).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>/kWh</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ border: '1px solid #10B981', bgcolor: '#ECFDF5', borderRadius: 2, p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, letterSpacing: 1, mb: 1 }}>OPTIMIZED RATE</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                      ₹{(netProltSpend / result.totalEnergyKwh).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669' }}>/kWh</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, letterSpacing: 1, mb: 1 }}>TOTAL UNITS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
                      {result.totalEnergyKwh.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>kWh</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};
