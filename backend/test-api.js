import axios from 'axios';

async function test() {
  try {
    const demandRes = await axios.get('http://localhost:8080/api/database/demand?date=2026-07-01&time=00:00&startDate=2026-06-01&endDate=2026-07-01');
    console.log("demandRes.data.success:", demandRes.data.success);
    console.log("raw length:", demandRes.data.data.allIndiaDemand.raw.length);
    console.log("adjusted length:", demandRes.data.data.allIndiaDemand.adjusted.length);

    const weatherRes = await axios.get('http://localhost:8080/api/database/weather');
    console.log("weatherRes.data.success:", weatherRes.data.success);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
