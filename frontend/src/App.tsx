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
      default: '#F8FAFC', // Slate 50 for a modern airy look
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B', // Slate 500
    },
    primary: {
      main: '#6366F1', // Indigo 500
      light: '#818CF8', // Indigo 400
      dark: '#4F46E5', // Indigo 600
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#10B981', // Emerald 500
      light: '#34D399', // Emerald 400
      dark: '#059669', // Emerald 600
      contrastText: '#FFFFFF'
    },
    divider: '#E2E8F0', // Slate 200
  },
  typography: {
    fontFamily: '"Inter", "Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, fontSize: '28px', letterSpacing: '-0.02em', color: '#0F172A' },
    h2: { fontWeight: 700, fontSize: '24px', letterSpacing: '-0.02em', color: '#0F172A' },
    h3: { fontWeight: 600, fontSize: '20px', letterSpacing: '-0.01em', color: '#0F172A' },
    h4: { fontWeight: 600, fontSize: '18px', color: '#0F172A' },
    h5: { fontWeight: 600, fontSize: '16px', color: '#0F172A' },
    h6: { fontWeight: 600, fontSize: '14px', color: '#1E293B' },
    subtitle1: { fontWeight: 500, fontSize: '14px', color: '#475569' },
    subtitle2: { fontWeight: 500, fontSize: '13px', color: '#64748B' },
    body1: { fontSize: '14px', lineHeight: 1.6, color: '#334155' },
    body2: { fontSize: '13px', lineHeight: 1.5, color: '#475569' },
    caption: { fontSize: '12px', color: '#64748B' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '14px',
      letterSpacing: '0.01em'
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          padding: '8px 18px',
          borderRadius: '8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)',
          border: '1px solid #4338CA',
          '&:hover': {
            background: 'linear-gradient(180deg, #4F46E5 0%, #4338CA 100%)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          }
        },
        outlined: {
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#334155',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
            color: '#0F172A'
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E2E8F0',
          borderRadius: '12px'
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)'
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)'
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)'
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
            borderColor: '#CBD5E1'
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
          textTransform: 'none',
          color: '#64748B',
          '&.Mui-selected': {
            color: '#4F46E5'
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F1F5F9',
          padding: '14px 16px',
          whiteSpace: 'nowrap',
          color: '#334155'
        },
        head: {
          fontWeight: 600,
          color: '#475569',
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.05em',
          backgroundColor: '#F8FAFC',
          whiteSpace: 'nowrap',
          borderBottom: '2px solid #E2E8F0'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              borderWidth: '2px',
            },
          },
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
