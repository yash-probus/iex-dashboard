export const exportToCSV = (data: any[], filename: string, columns?: { field: string, headerName: string }[]) => {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Get headers from columns if provided, otherwise fallback to object keys
  const exportFields = columns ? columns.map(c => c.field) : Object.keys(data[0]);
  const exportHeaders = columns ? columns.map(c => c.headerName) : exportFields;
  
  // Build CSV string
  const csvRows = [];
  csvRows.push(exportHeaders.join(','));

  data.forEach(row => {
    const values = exportFields.map(field => {
      const val = row[field];
      // Format value safely
      const formattedVal = val !== undefined && val !== null ? val : '';
      return `"${formattedVal}"`; // wrap in quotes to avoid issues with commas
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
