import sys

filepath = "/Users/yashgupta/IEX-Dashboard/frontend/src/pages/SavingsCalculatorPage.tsx"

with open(filepath, "r") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* TOD Monthly Consumption Dialog */}" in line:
        start_idx = i
        break

if start_idx != -1:
    open_count = 0
    found_dialog = False
    for i in range(start_idx, len(lines)):
        if "<Dialog" in lines[i]:
            found_dialog = True
        
        if "</Dialog>" in lines[i] and found_dialog:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    replacement = """      {/* TOD Monthly Consumption Dialog */}
      <Dialog
        open={todDialogOpen}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setTodDialogOpen(false); }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 2, bgcolor: '#F8FAFC' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, pb: 0 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>Enter ToD Consumption</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Add monthly consumption data for each Time-of-Day period</Typography>
          </Box>
          <IconButton onClick={() => setTodDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {getTodSlabsForMonth(1).length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please select a State, DISCOM, and Category first to load the correct TOD slabs.
            </Alert>
          )}

          {Object.keys(todConsumptions).sort().map((ym, index) => {
            const targetMonth = parseInt(ym.split('-')[1], 10);
            const monthSlabs = getTodSlabsForMonth(targetMonth);
            return (
              <Accordion key={ym} defaultExpanded={index === 0} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                     <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                       {new Date(`${ym}-01`).toLocaleString('default', { month: 'short', year: 'numeric' })}
                     </Typography>
                     <IconButton size="small" onClick={(e) => { e.stopPropagation(); const newTc = { ...todConsumptions }; delete newTc[ym]; setTodConsumptions(newTc); }}>
                       <DeleteIcon fontSize="small" color="action" />
                     </IconButton>
                   </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3, pt: 1 }}>
                  
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>Month</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <DateRangePicker
                      startDate={todConsumptions[ym]['Start Date'] || ''}
                      endDate={todConsumptions[ym]['End Date'] || ''}
                      onChange={(start, end) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Start Date': start, 'End Date': end } }))}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>Total Monthly Consumption (Energy per TOD Slab)</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {monthSlabs.map(slab => (
                      <Grid item xs={12} sm={3} key={slab}>
                        <TextField
                          label={`${slab}`}
                          value={todConsumptions[ym][slab] || ''}
                          onChange={(e) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], [slab]: e.target.value } }))}
                          fullWidth variant="outlined" size="small" type="number" placeholder="0" sx={{ bgcolor: '#FFF' }}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>Peak Demand & Charges</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                     <Grid item xs={12} sm={6}>
                       <TextField
                         label="Peak Demand (kVA)"
                         value={todConsumptions[ym]['Peak Demand (kVA)'] || ''}
                         onChange={(e) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Peak Demand (kVA)': e.target.value } }))}
                         variant="outlined" size="small" fullWidth type="number" placeholder="e.g., 500" sx={{ bgcolor: '#FFF' }}
                       />
                     </Grid>
                     <Grid item xs={12} sm={6}>
                       <TextField
                         label="Miscellaneous Charges (₹)"
                         value={todConsumptions[ym]['Miscellaneous Charges'] || ''}
                         onChange={(e) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Miscellaneous Charges': e.target.value } }))}
                         fullWidth variant="outlined" size="small" type="number" placeholder="e.g., 250000" sx={{ bgcolor: '#FFF' }}
                       />
                     </Grid>
                  </Grid>

                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>Advanced Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Power Factor"
                        value={todConsumptions[ym]['Power Factor'] || ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val !== '') { if (Number(val) > 1) val = '1'; else if (Number(val) < 0) val = ''; }
                          setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Power Factor': val } }))
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== '' && Number(e.target.value) <= 0) {
                            setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Power Factor': '0.01' } }))
                          }
                        }}
                        fullWidth variant="outlined" size="small" type="number" placeholder="e.g., 0.99" inputProps={{ max: 1, min: 0.01, step: 0.01 }} sx={{ bgcolor: '#FFF' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Current LPSC (₹)"
                        value={todConsumptions[ym]['Current LPSC'] || ''}
                        onChange={(e) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Current LPSC': e.target.value } }))}
                        fullWidth variant="outlined" size="small" type="number" placeholder="0" sx={{ bgcolor: '#FFF' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Arrear Amount (₹)"
                        value={todConsumptions[ym]['Arrear Amount'] || ''}
                        onChange={(e) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Arrear Amount': e.target.value } }))}
                        fullWidth variant="outlined" size="small" type="number" placeholder="0" sx={{ bgcolor: '#FFF' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" sx={{ mt: 1 }}>
                        <FormLabel component="legend" sx={{ fontSize: '12px', color: 'text.secondary', mb: 0.5 }}>Electricity Duty Applied?</FormLabel>
                        <RadioGroup row value={todConsumptions[ym]['Electricity Duty'] || 'Yes'} onChange={(e) => setTodConsumptions(prev => ({ ...prev, [ym]: { ...prev[ym], 'Electricity Duty': e.target.value } }))}>
                          <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }} />} label={<Typography variant="body2">Yes</Typography>} />
                          <FormControlLabel value="No" control={<Radio size="small" sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }} />} label={<Typography variant="body2">No</Typography>} />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  </Grid>

                </AccordionDetails>
              </Accordion>
            );
          })}

          <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8FAFC', borderRadius: '12px' }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>New Month</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3, pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>Month</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField select label="Year" value={entryYear} onChange={(e) => setEntryYear(Number(e.target.value))} size="small" sx={{ width: 120, bgcolor: '#FFF' }}>
                  <MenuItem value={2023}>2023</MenuItem>
                  <MenuItem value={2024}>2024</MenuItem>
                  <MenuItem value={2025}>2025</MenuItem>
                  <MenuItem value={2026}>2026</MenuItem>
                </TextField>
                <TextField select label="Month" value={entryMonth} onChange={(e) => setEntryMonth(Number(e.target.value))} size="small" sx={{ width: 150, bgcolor: '#FFF' }}>
                  <MenuItem value={1}>January</MenuItem>
                  <MenuItem value={2}>February</MenuItem>
                  <MenuItem value={3}>March</MenuItem>
                  <MenuItem value={4}>April</MenuItem>
                  <MenuItem value={5}>May</MenuItem>
                  <MenuItem value={6}>June</MenuItem>
                  <MenuItem value={7}>July</MenuItem>
                  <MenuItem value={8}>August</MenuItem>
                  <MenuItem value={9}>September</MenuItem>
                  <MenuItem value={10}>October</MenuItem>
                  <MenuItem value={11}>November</MenuItem>
                  <MenuItem value={12}>December</MenuItem>
                </TextField>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                fullWidth
                onClick={() => {
                  const key = `${entryYear}-${String(entryMonth).padStart(2, '0')}`;
                  if (!todConsumptions[key]) {
                    let defaultStart = '';
                    let defaultEnd = '';
                    if (discom === 'NPCL') {
                      defaultStart = `${entryYear}-${String(entryMonth).padStart(2, '0')}-19`;
                      const nextMonthDate = new Date(entryYear, entryMonth - 1 + 1, 18);
                      defaultEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-18`;
                    } else {
                      defaultStart = `${entryYear}-${String(entryMonth).padStart(2, '0')}-01`;
                      const lastDay = new Date(entryYear, entryMonth, 0).getDate();
                      defaultEnd = `${entryYear}-${String(entryMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                    }
                    setTodConsumptions(prev => ({
                      ...prev,
                      [key]: {
                        'Power Factor': '',
                        'Start Date': defaultStart,
                        'End Date': defaultEnd,
                        'Electricity Duty': 'Yes',
                        'Miscellaneous Charges': ''
                      }
                    }));
                  }
                }}
                sx={{ mt: 3, height: 48, textTransform: 'none', borderRadius: 2, borderStyle: 'dashed', color: '#1E293B', borderColor: '#CBD5E1' }}
              >
                + Add Month
              </Button>
            </AccordionDetails>
          </Accordion>

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              if (!isTodValid()) {
                setSnackbar({ open: true, message: 'Please enter valid consumption values for at least one month.', severity: 'error' });
                return;
              }
              setTodDialogOpen(false);
              setProltDialogOpen(true);
            }}
            sx={{
              bgcolor: '#F87171',
              '&:hover': { bgcolor: '#EF4444' },
              borderRadius: 2,
              textTransform: 'none',
              height: 48,
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            Preview Inputs
          </Button>
        </DialogActions>
      </Dialog>
"""
    new_lines = lines[:start_idx] + [replacement] + lines[end_idx+1:]
    with open(filepath, "w") as f:
        f.writelines(new_lines)
    print("Replaced dialog successfully!")
else:
    print(f"Failed to find dialog bounds. start={start_idx}, end={end_idx}")
