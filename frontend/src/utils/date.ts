/**
 * Formats an ISO date string into a professional presentation format.
 * Returns '—' if the date is null or invalid.
 * Example output: "08 Jun 2026"
 */
export const formatOverviewDate = (dateString: string | null): string => {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};
