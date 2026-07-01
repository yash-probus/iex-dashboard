async function test() {
  try {
    let res = await fetch('http://localhost:8080/api/database/demand?date=2026-07-01&time=00:00&startDate=2026-06-01&endDate=2026-07-01');
    let data = await res.json();
    console.log("demandRes.success:", data.success);
    console.log("raw length:", data.data.allIndiaDemand.raw.length);
    console.log("adjusted length:", data.data.allIndiaDemand.adjusted.length);

    let res2 = await fetch('http://localhost:8080/api/database/weather');
    let data2 = await res2.json();
    console.log("weatherRes.success:", data2.success);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
