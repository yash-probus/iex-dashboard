import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Grid
} from '@mui/material';
import { FormField } from '../../pages/admin/resource-center/config/resourceConfig';

interface ResourceFormModalProps {
  open: boolean;
  title: string;
  fields: FormField[];
  initialData?: any;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ResourceFormModal({ 
  open, title, fields, initialData, isSubmitting = false, onClose, onSave 
}: ResourceFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        const defaults: Record<string, any> = {};
        fields.forEach(f => {
          defaults[f.name] = f.type === 'number' ? '' : '';
        });
        setFormData(defaults);
      }
    }
  }, [open, initialData, fields]);

  const handleChange = (name: string, value: any, type: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSave = () => {
    // Basic validation: ensure all visible fields are filled
    const isValid = visibleFields.every(f => formData[f.name] !== '' && formData[f.name] !== undefined);
    if (!isValid) {
      alert('All fields are mandatory.');
      return;
    }
    onSave(formData);
  };

  const handleClose = (event?: any, reason?: string) => {
    if (isSubmitting) return;
    onClose();
  };

  // Determine modal size based on number of fields
  const isLarge = fields.length > 6;

  // Filter fields: hide 'id' when creating (initialData is null)
  const visibleFields = fields.filter(f => {
    if (!initialData && f.name === 'id') return false;
    return true;
  });

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      disableEscapeKeyDown={isSubmitting}
      maxWidth={isLarge ? 'md' : 'sm'} 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', pb: 2, mb: 2 }}>
        {initialData ? 'Edit' : 'Add'} {title} Record
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {visibleFields.map((field) => (
            <Grid item xs={12} sm={isLarge ? 6 : 12} key={field.name}>
              {field.type === 'dropdown' ? (
                <TextField
                  select
                  fullWidth
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                  variant="outlined"
                  size="small"
                  disabled={isSubmitting || (field.name === 'id' && !!initialData)}
                >
                  {field.options?.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label={field.label}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] === undefined ? '' : formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                  variant="outlined"
                  size="small"
                  disabled={isSubmitting || (field.name === 'id' && !!initialData)}
                  inputProps={field.type === 'number' ? { step: 'any' } : {}}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider', mt: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSave} disabled={isSubmitting} variant="contained">
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
