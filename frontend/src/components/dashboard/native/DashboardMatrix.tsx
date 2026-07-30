import React from 'react';
import { Box, Typography } from '@mui/material';

export interface MonthData {
  month: string;
  saving: string | number;
  coverage: string | number;
}

interface DashboardMatrixProps {
  months: MonthData[];
  onMonthClick: (month: string) => void;
  activeMonth?: string;
}

export const DashboardMatrix: React.FC<DashboardMatrixProps> = ({ months, onMonthClick, activeMonth }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(110px, 1fr))',
          sm: 'repeat(3, minmax(110px, 1fr))',
          md: 'repeat(6, minmax(110px, 1fr))',
          lg: 'repeat(12, minmax(95px, 1fr))',
        },
        gap: '8px',
        overflow: 'auto',
        paddingBottom: '4px',
      }}
    >
      {months.map((m, idx) => (
        <Box
          key={idx}
          onClick={() => onMonthClick(m.month)}
          sx={{
            border: '1px solid #dce5ef',
            borderColor: activeMonth === m.month ? '#1769e0' : '#dce5ef',
            borderRadius: '12px',
            padding: '11px',
            background: activeMonth === m.month ? '#f0f7ff' : '#fff',
            cursor: 'pointer',
            transition: '.15s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 18px rgba(15, 41, 73, .09)',
              borderColor: '#a8bed7',
            },
          }}
        >
          <Typography component="strong" sx={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
            {m.month}
          </Typography>
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 950,
              color: '#159765',
              margin: '7px 0 3px',
            }}
          >
            {m.saving}
          </Typography>
          <Typography component="small" sx={{ fontSize: '10px', color: '#65758b' }}>
            {m.coverage}% OA
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
