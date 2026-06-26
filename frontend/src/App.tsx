import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E1E2C',
      secondary: '#6B7280',
    },
    primary: {
      main: '#F29F67', 
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#3B8FF3',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '22px' },
    h2: { fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '20px' },
    h3: { fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '18px' },
    h4: { fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '16px' },
    h5: { fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '14px' },
    h6: { fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '13px' },
    subtitle1: { fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '13px' },
    subtitle2: { fontFamily: '"Poppins", sans-serif', fontWeight: 500, fontSize: '12px' },
    body1: { fontSize: '13px' },
    body2: { fontSize: '12px' },
    caption: { fontSize: '11px' },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '12px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          padding: '4px 12px',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 500,
          minHeight: '48px',
        }
      }
    }
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <NotificationProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </ThemeProvider>
      {(import.meta as any).env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
