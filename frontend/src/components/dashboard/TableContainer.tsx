import React from 'react';
import { 
  Paper, Box, Typography, Button, Skeleton,
  Table, TableBody, TableCell, TableContainer as MuiTableContainer, TableHead, TableRow, alpha 
} from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';

export interface ColumnDefinition {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  sticky?: boolean;
  align?: 'left' | 'right' | 'center';
  valueFormatter?: (value: any) => any;
  renderCell?: (row: any) => React.ReactNode;
}

interface TableContainerProps {
  title: string;
  data: any[];
  columns: ColumnDefinition[];
  onExport?: () => void;
  emptyStateMessage?: React.ReactNode;
  loading?: boolean;
}

export default function TableContainer({ title, data, columns, onExport, emptyStateMessage, loading = false }: TableContainerProps) {
  // Calculate sticky left offsets
  let currentLeftOffset = 0;
  const columnsWithOffsets = columns.map(col => {
    const colObj = { ...col, leftOffset: currentLeftOffset };
    if (col.sticky) {
      currentLeftOffset += (col.width || col.minWidth || 100);
    }
    return colObj;
  });

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>

      {/* Render all rows directly. High performance container. */}
      <MuiTableContainer sx={{ maxHeight: 600, backgroundColor: 'background.paper', height: 'fit-content' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
          <TableHead>
            <TableRow>
              {columnsWithOffsets.map(col => (
                <TableCell 
                  key={col.field}
                  align="center"
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1E293B',
                    backgroundColor: '#F8FAFC',
                    backgroundImage: 'none',
                    borderBottom: '2px solid',
                    borderRight: col.sticky ? '1px solid #E2E8F0' : 'none',
                    borderColor: 'divider',
                    fontSize: '11px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    minWidth: col.minWidth,
                    position: 'sticky',
                    top: 0,
                    left: col.sticky ? col.leftOffset : 'auto',
                    zIndex: col.sticky ? 40 : 30,
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={columns.length} sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1 }} />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ height: 'auto', borderBottom: 'none' }}>
                  {emptyStateMessage || (
                    <Typography variant="body2" color="text.secondary">No records found for this date range.</Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow 
                  key={index}
                  hover
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.01)' } 
                  }}
                >
                  {columnsWithOffsets.map(col => {
                    const value = row[col.field];
                    const displayValue = col.valueFormatter ? col.valueFormatter(value) : value;
                    return (
                      <TableCell 
                        key={col.field}
                        align={col.align || "center"}
                        sx={{ 
                          fontSize: '12px',
                          color: 'text.primary',
                          borderRight: col.sticky ? '1px solid' : 'none',
                          borderColor: 'divider',
                          whiteSpace: 'nowrap',
                          position: col.sticky ? 'sticky' : 'static',
                          left: col.sticky ? col.leftOffset : 'auto',
                          // Explicit opaque background merging row striping to prevent sticky transparency overlap
                          backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA', 
                          zIndex: col.sticky ? 20 : 'auto',
                        }}
                      >
                        {col.renderCell 
                          ? col.renderCell(row) 
                          : (displayValue !== undefined && displayValue !== null ? displayValue : '-')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </MuiTableContainer>
      
      {/* Footer summarizing record count without pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {loading ? 'Loading records...' : data.length === 0 ? 'No records' : data.length === 1 ? 'Showing 1 record' : `Showing ${data.length} records`}
        </Typography>
      </Box>
    </Paper>
  );
}
