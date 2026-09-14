const todConsumptions = {
  '2026-09': {
    'Start Date': '2026-09-01',
    'End Date': '2026-09-30',
    'Billing Unit': 'kVAh',
    'Power Factor': '0.99',
    '3:00-5:00': '1000'
  }
};

const payload = {
        todConsumptions: Object.keys(todConsumptions).length > 0 ?
          Object.fromEntries(
            Object.entries(todConsumptions).map(([ym, data]) => {
              const stringFields = ['Start Date', 'End Date', 'Electricity Duty', 'Bill Date', 'Season', 'Billing Month', 'Billing Unit'];
              const monthSlabs = ['3:00-5:00'];
              
              const billingUnit = data['Billing Unit'] || 'kVAh';
              const isKvah = billingUnit === 'kVAh';
              
              const pfInput = data['Power Factor'];
              const pf = pfInput && String(pfInput).trim() !== '' ? Number(pfInput) : (isKvah ? 0.99 : 1);

              const processed = {};

              Object.entries(data).forEach(([k, v]) => {
                if (!v || String(v).trim() === '') return;
                if (stringFields.includes(k)) {
                  processed[k] = v;
                } else if (monthSlabs.includes(k) || k.toUpperCase() === 'FLAT' || k.toUpperCase() === 'TOTAL') {
                  const inputVal = parseFloat(String(v));
                  if (!isNaN(inputVal)) {
                    processed[k] = parseFloat(inputVal.toFixed(4));
                  }
                } else {
                  processed[k] = parseFloat(String(v));
                }
              });

              return [ym, processed];
            })
          )
          : undefined,
}
console.log(payload);
