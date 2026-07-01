const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:8080/api/database/demand?date=2026-07-01&time=17:45&startDate=2026-06-01&endDate=2026-07-01');
    console.log("demandRes.data.success:", res.data.success);
    console.log("raw length:", res.data.data.allIndiaDemand.raw.length);
    console.log("adjusted length:", res.data.data.allIndiaDemand.adjusted.length);
  } catch (e) {
    console.error(e.message);
  }
}
test();
