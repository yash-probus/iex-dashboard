import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('https://www.iexindia.com/market-data/real-time-market/market-snapshot', { waitUntil: 'networkidle2' });
  
  const selectHandles = await page.$$('.MuiSelect-select');
  if (selectHandles.length >= 2) {
    await selectHandles[1].click();
    await new Promise(r => setTimeout(r, 500));
    const options = await page.$$('li[role="option"]');
    for (const opt of options) {
      const text = await page.evaluate(el => el.textContent, opt);
      if (text === '-Select Range-') { await opt.click(); break; }
    }
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
       const inputs = Array.from(document.querySelectorAll('input')).filter(i => i.placeholder === 'DD-MM-YYYY');
       if (inputs.length >= 2) {
         const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
         if (nativeInputValueSetter) {
             nativeInputValueSetter.call(inputs[0], '01-07-2024');
             inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
             nativeInputValueSetter.call(inputs[1], '01-07-2024');
             inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
         }
       }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const updateBtn = btns.find(b => b.innerText.includes('Update Report'));
      if (updateBtn) updateBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    // Scroll and aggregate
    const allData = await page.evaluate(async () => {
      const tableContainer = document.querySelector('table')?.parentElement;
      if (!tableContainer) return [];
      
      const resultSet = new Map(); // deduplicate by stringified row
      
      let previousScrollTop = -1;
      while (tableContainer.scrollTop !== previousScrollTop) {
        previousScrollTop = tableContainer.scrollTop;
        
        // Extract visible rows
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        for (const row of rows) {
          const columns = Array.from(row.querySelectorAll('td')).map(c => (c as HTMLElement).innerText.trim());
          if (columns.length >= 5) {
            resultSet.set(columns.join('|'), columns);
          }
        }
        
        // Scroll down
        tableContainer.scrollBy(0, 500);
        await new Promise(r => setTimeout(r, 500));
      }
      return Array.from(resultSet.values());
    });
    
    console.log('Total aggregated rows:', allData.length);
  }
  
  await browser.close();
})();
