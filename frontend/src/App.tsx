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
      default: '#EAF9F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#001356',
      secondary: '#566578',
    },
    primary: {
      main: '#2E51FF',
      light: '#5C7CFF',
      dark: '#1B3CC7',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#A3B5CB',
      light: '#C6D4E3',
      dark: '#6A7D95',
    },
    divider: '#C6D4E3',
  },
  typography: {
    fontFamily: '"Hanken Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: '24px', letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: '20px' },
    h4: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: '18px' },
    h5: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: '16px' },
    h6: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: '14px' },
    subtitle1: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 500, fontSize: '14px' },
    subtitle2: { fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 500, fontSize: '13px' },
    body1: { fontSize: '14px', lineHeight: 1.6 },
    body2: { fontSize: '13px', lineHeight: 1.5 },
    caption: { fontSize: '12px' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '13px',
      letterSpacing: '0.01em'
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
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        contained: {
          background: 'linear-gradient(to right, #EA580C, #F97316)',
        },
        outlined: {
          borderColor: '#E2E8F0',
          '&:hover': {
            borderColor: '#EA580C',
            backgroundColor: 'transparent'
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid #F1F5F9'
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        },
        elevation2: {
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)'
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid #F1F5F9',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)'
          }
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 600,
          minHeight: '48px',
          textTransform: 'none'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F1F5F9',
          padding: '16px',
          whiteSpace: 'nowrap',
        },
        head: {
          fontWeight: 600,
          color: '#64748B',
          textTransform: 'none',
          fontSize: '12px',
          letterSpacing: '0.05em',
          backgroundColor: '#F8FAFC',
          whiteSpace: 'nowrap',
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
