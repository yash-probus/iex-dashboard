export const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.rel = 'noopener';
  link.href = window.URL.createObjectURL(blob);
  
  setTimeout(() => window.URL.revokeObjectURL(link.href), 40000); // 40s timeout just like file-saver
  
  setTimeout(() => {
    try {
      link.dispatchEvent(new MouseEvent('click'));
    } catch (e) {
      const evt = document.createEvent('MouseEvents');
      evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      link.dispatchEvent(evt);
    }
  }, 0);
};
