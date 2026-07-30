import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Dashboard } from '../components/dashboard/Dashboard';
import { fetchClientOverview, ClientOverviewResult } from '../api/savingsCalculator.api';

export default function SavingsCalculatorViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [clientOverview, setClientOverview] = useState<ClientOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchClientOverview(id);
        setClientOverview(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load client details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton 
          onClick={() => navigate('/savings-calculator')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Client Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View detailed configuration and history for this client
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider', height: '100vh' }}>
          <Dashboard calcEntry={null} clientOverview={clientOverview} clientName={clientOverview?.clientName} selectedMonth="all" />
        </Box>
      )}
    </Box>
  );
}
