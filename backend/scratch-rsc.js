const axios = require('axios');

(async () => {
    try {
        const url = 'https://www.iexindia.com/calculator?voltage=11&state=Uttar+Pradesh&consumerCategory=Industrial+General&todMonth=Apr+-+Sept&todSlot=RTC+(24+Hrs)&iexPrice=4.5';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1' } });
        console.log("RSC response size:", res.data.length);
        require('fs').writeFileSync('rsc_dump.txt', res.data);
    } catch (e) {
        console.error(e);
    }
})();
