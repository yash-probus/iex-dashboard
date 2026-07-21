const express = require('express');
const app = express();
app.use(express.json());
app.post('/', (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => {
  console.log('Error caught:', err.message);
  res.status(400).json({ error: err.message });
});
const server = app.listen(3000, () => {
  const http = require('http');
  const req = http.request({
    port: 3000,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('Response:', data);
      server.close();
    });
  });
  req.write('null');
  req.end();
});
