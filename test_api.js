const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/proposals/generate-commercial',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({
  client_name: "Test Client",
  connectivity: "11 KV",
  discom_name: "PVVNL",
  abt_supply_cost: 100,
  iex_annual_fee: 100
}));
req.end();
