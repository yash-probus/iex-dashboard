function parseTraderDate(dateStr) {
  if (!dateStr) return null;
  // If DD-MM-YYYY
  if (dateStr.length === 10 && dateStr.charAt(2) === '-' && dateStr.charAt(5) === '-') {
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}
console.log(parseTraderDate("14-09-2026"));
console.log(parseTraderDate("2026-09-14"));
