import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { apiClient } from '../../api/client';

interface Holiday {
  id: string;
  month: string;
  holidayDate: string;
  holidayName: string;
  holidayType: string;
  state: string;
}

export default function HolidayCalendarView() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/database/holidays');
      if (res.data?.success && res.data?.data) {
        setHolidays(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching holiday calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/database/holidays/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 200) {
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded ${res.data.count || ''} holidays!`,
        });
        fetchHolidays();
      } else {
        setUploadStatus({
          type: 'error',
          message: res.data?.message || 'Failed to upload holiday calendar.',
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.message || err.message || 'An error occurred during upload.',
      });
    } finally {
      setUploading(false);
      // Reset input value
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvRows = [
      ['Month', 'Holiday_date', 'Holiday_name', 'Holiday_type', 'State'],
      ['April', '05-04-2025', "Babu Jagjivan Ram's Birthday", 'SH', 'Andhra Pradesh'],
      ['April', '14-04-2025', "Dr. B.R. Ambedkar's Birthday", 'CH_SH', 'Andhra Pradesh'],
      ['May', '01-05-2025', 'May Day', 'SH', 'Andhra Pradesh'],
      ['August', '15-08-2025', 'Independence Day', 'CH_SH', 'Andhra Pradesh'],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Holiday_Calendar_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredHolidays = holidays.filter((h) => {
    const matchesSearch =
      h.holidayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.holidayType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonth = selectedMonth === 'All' || h.month.toLowerCase() === selectedMonth.toLowerCase();

    return matchesSearch && matchesMonth;
  });

  const months = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getTypeChipColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('CH') && t.includes('SH')) {
      return { bg: '#FFEAEF', color: '#E91E63' }; // Clearing & Settlement
    }
    if (t.includes('CH')) {
      return { bg: '#E3F2FD', color: '#1E88E5' }; // Clearing
    }
    return { bg: '#E8F5E9', color: '#43A047' }; // Settlement (SH)
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Title and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="700">
            Holiday Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and view power exchange settlement and clearing holidays.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={downloadTemplate}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          Download Template
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Upload Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px dashed',
              borderColor: alpha('#3B8FF3', 0.4),
              bgcolor: alpha('#3B8FF3', 0.02),
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: 250,
            }}
          >
            <input
              accept=".csv, .xlsx, .xls"
              id="upload-holiday-file"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="upload-holiday-file" style={{ width: '100%', cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: alpha('#3B8FF3', 0.1),
                    color: '#3B8FF3',
                  }}
                >
                  <UploadIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" fontWeight="600">
                  {uploading ? 'Processing File...' : 'Upload Holiday Calendar'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ maxW: 240 }}>
                  Supports .xlsx, .xls, and .csv formats matching the required headers.
                </Typography>
                {uploading ? (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                ) : (
                  <Button
                    variant="contained"
                    component="span"
                    color="primary"
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' },
                    }}
                  >
                    Select File
                  </Button>
                )}
              </Box>
            </label>

            {uploadStatus && (
              <Box
                sx={{
                  mt: 3,
                  p: 1.5,
                  borderRadius: 2,
                  width: '100%',
                  bgcolor: uploadStatus.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                  color: uploadStatus.type === 'success' ? '#15803D' : '#B91C1C',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {uploadStatus.message}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Calendar List Card */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  placeholder="Search holiday, state..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', maxW: '100%', pb: 0.5 }}>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      padding: '8.5px 14px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      backgroundColor: '#FFF',
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : filteredHolidays.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Holiday Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>State</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHolidays.map((row) => {
                        const chipStyle = getTypeChipColor(row.holidayType);
                        return (
                          <TableRow key={row.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' } }}>
                            <TableCell sx={{ fontWeight: 500 }}>{row.month}</TableCell>
                            <TableCell>{row.holidayDate}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{row.holidayName}</TableCell>
                            <TableCell>
                              <Chip
                                label={row.holidayType}
                                size="small"
                                sx={{
                                  bgcolor: chipStyle.bg,
                                  color: chipStyle.color,
                                  fontWeight: 'bold',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {row.state}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography variant="subtitle1" fontWeight="600" color="text.secondary">
                    No Holidays Found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Upload a holiday calendar spreadsheet to get started.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
