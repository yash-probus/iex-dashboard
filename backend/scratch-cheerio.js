const axios = require('axios');

(async () => {
    try {
        const url = 'https://www.iexindia.com/landed-cost-calculator?voltage=11&state=Uttar+Pradesh&consumerCategory=Industrial+General&todMonth=Apr+-+Sept&todSlot=RTC+(24+Hrs)&iexPrice=4.5';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        
        // Let's find some known values that should be in the response
        // e.g. ISTS Charges, STU Charges, Landed Cost (Rs./kWh)
        console.log("Contains 'ISTS Charges':", html.includes('ISTS Charges'));
        console.log("Contains 'Landed Cost (Rs./kWh)':", html.includes('Landed Cost (Rs./kWh)'));
        console.log("Contains 'Discom Tariff':", html.includes('Discom Tariff'));
        console.log("Contains 'Savings':", html.includes('Savings'));
        
        // Print out any script tags that might contain the data
        const matches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (matches) {
            for (const m of matches) {
                if (m.includes('ISTS Charges') || m.includes('Landed Cost')) {
                    console.log("FOUND IN SCRIPT:", m.substring(0, 500));
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
})();
