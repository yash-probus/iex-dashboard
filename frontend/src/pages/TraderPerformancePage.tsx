import React, { useState } from 'react';
import { Box, Typography, Stepper, Step, StepLabel, Button, Paper, Alert } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const steps = [
  'Upload IEX Bills',
  'Data of Daily Purchase',
  'Existing New Savings Calculator Report',
  'Comparison'
];

export default function TraderPerformancePage() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file.');
      return;
    }
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/trader-performance/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setParsedData(response.data);
      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
        Trader Performance
      </Typography>

      <Stepper activeStep={activeStep} sx={{ my: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {activeStep === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '2px dashed #ccc' }}>
          <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload IEX Bills (DAM, GDAM, RTM)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You can select multiple files at once. Ensure filenames start with DAM, GDAM_IEX, or RTM_IEX.
          </Typography>
          <Button variant="contained" component="label">
            Select Files
            <input type="file" hidden multiple accept=".pdf" onChange={handleFileChange} />
          </Button>
          
          {files.length > 0 && (
            <Box sx={{ mt: 3, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <Typography variant="subtitle2">Selected Files:</Typography>
              <ul style={{ paddingLeft: 20 }}>
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Processing...' : 'Upload & Process'}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>Parsed Daily Purchase Data</Typography>
          <Paper sx={{ p: 3, maxHeight: 400, overflow: 'auto', bgcolor: '#1e1e1e', color: '#fff' }}>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </Paper>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>Back</Button>
            <Button variant="contained" onClick={() => setActiveStep(2)}>Next: View Calculator Report</Button>
          </Box>
        </Box>
      )}

      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Existing New Savings Calculator Report</Typography>
          <Paper sx={{ p: 3, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              (Calculator UI will be integrated here based on the parsed data)
            </Typography>
          </Paper>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => setActiveStep(1)}>Back</Button>
            <Button variant="contained" onClick={() => setActiveStep(3)}>Next: Compare Results</Button>
          </Box>
        </Box>
      )}

      {activeStep === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>Comparison</Typography>
          <Paper sx={{ p: 3, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              Original DISCOM vs OA_DISCOM vs Trader Reports
            </Typography>
          </Paper>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => setActiveStep(2)}>Back</Button>
            <Button variant="contained" color="success">Finish</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
