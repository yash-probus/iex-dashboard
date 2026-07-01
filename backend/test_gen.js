async function test() {
  try {
    let res = await fetch('http://localhost:8080/api/database/generation?date=2026-07-01&startDate=2026-06-01&endDate=2026-07-01');
    let data = await res.json();
    console.log("genRes keys:", Object.keys(data.data));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
