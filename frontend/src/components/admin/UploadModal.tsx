import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Select, MenuItem, FormControl, InputLabel, CircularProgress, IconButton, TextField, LinearProgress, Alert, Paper
} from '@mui/material';
import { CloudUpload as UploadIcon, CheckCircle, Close as CloseIcon, Description as FileIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { uploadApi } from '../../api/upload.api';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

type UploadStep = 'select' | 'uploading' | 'replace_confirm' | 'success';

export default function UploadModal({ open, onClose, onUploadSuccess }: UploadModalProps) {
  const { showNotification } = useNotification();
  
  const [step, setStep] = useState<UploadStep>('select');
  const [market, setMarket] = useState('DAM');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const resetState = () => {
    setStep('select');
    setMarket('DAM');
    setFile(null);
    setProgress(0);
    setError(null);
    setUploadResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const executeUpload = async (action?: 'replace') => {
    if (!file) return;

    setStep('uploading');
    setProgress(0);
    setError(null);

    try {
      const res = await uploadApi.uploadDataset(market, date, file, action, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      setUploadResult(res);
      setStep('success');
      
      try {
        onUploadSuccess(); // Trigger parent refresh
      } catch (err) {
        // Requirement 5: Refresh Failure Handling
        showNotification('Upload successful, but UI refresh failed. Please refresh the page manually.', 'warning');
      }

    } catch (err: any) {
      // Check for 409 Conflict (Duplicate Dataset) -> Requirement 1
      if (err.response?.status === 409) {
        setStep('replace_confirm');
      } else {
        setError(err.response?.data?.message || err.message || 'An unexpected error occurred during upload.');
        setStep('select');
      }
    }
  };

  const handleProcess = () => {
    executeUpload();
  };

  const handleReplaceConfirm = () => {
    executeUpload('replace');
  };

  return (
    <Dialog open={open} onClose={step === 'uploading' ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Upload Market Data</Typography>
        <IconButton onClick={handleClose} size="small" disabled={step === 'uploading'}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {step === 'select' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Market</InputLabel>
                <Select value={market} label="Market" onChange={(e) => setMarket(e.target.value)}>
                  <MenuItem value="DAM">Day Ahead Market (DAM)</MenuItem>
                  <MenuItem value="GDAM">Green Day Ahead (GDAM)</MenuItem>
                  <MenuItem value="RTM">Real Time Market (RTM)</MenuItem>
                </Select>
              </FormControl>
              
              <TextField 
                type="date" 
                label="Delivery Date" 
                size="small" 
                fullWidth 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }} 
              />
            </Box>

            <Box 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              sx={{
                border: '2px dashed',
                borderColor: file ? 'primary.main' : 'divider',
                backgroundColor: file ? 'rgba(59, 143, 243, 0.05)' : 'background.default',
                borderRadius: 2,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(59, 143, 243, 0.05)'
                }
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                accept=".csv,.xlsx" 
                hidden 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
                }} 
              />
              {file ? (
                <>
                  <FileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle2" color="text.primary">{file.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(1)} KB</Typography>
                </>
              ) : (
                <>
                  <UploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.primary" gutterBottom>
                    Click or drag file to this area to upload
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Support for a single or bulk CSV/XLSX upload. Maximum file size 10MB.
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        )}

        {step === 'uploading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 3 }}>
            <CircularProgress size={48} thickness={4} />
            <Box sx={{ width: '80%', textAlign: 'center' }}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                Uploading Dataset...
              </Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {progress}% Completed
              </Typography>
            </Box>
          </Box>
        )}

        {step === 'replace_confirm' && (
          <Box sx={{ py: 3 }}>
            <Alert severity="warning" icon={<WarningIcon fontSize="inherit" />} sx={{ mb: 3 }}>
              A dataset for <strong>{market}</strong> on <strong>{new Date(date).toLocaleDateString()}</strong> already exists.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to replace the existing dataset? 
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Replacing it will archive the old dataset and immediately publish the new one to the public dashboard. This action will be recorded in the Upload History.
            </Typography>
          </Box>
        )}

        {step === 'success' && uploadResult && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h4" color="text.primary">Upload Successful</Typography>
            
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main', borderRadius: 2, width: '100%', mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Market:</strong> {uploadResult.market}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Delivery Date:</strong> {new Date(uploadResult.deliveryDate).toLocaleDateString()}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>File Name:</strong> {uploadResult.fileName}</Typography>
              <Typography variant="body2"><strong>Rows Parsed:</strong> {uploadResult.rowCount}</Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {step === 'select' && (
          <>
            <Button onClick={handleClose} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleProcess} disabled={!file}>Upload File</Button>
          </>
        )}
        {step === 'replace_confirm' && (
          <>
            <Button onClick={() => setStep('select')} color="inherit">Cancel</Button>
            <Button variant="contained" color="warning" onClick={handleReplaceConfirm}>Yes, Replace Dataset</Button>
          </>
        )}
        {step === 'success' && (
          <Button variant="contained" onClick={handleClose} fullWidth>Done</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
