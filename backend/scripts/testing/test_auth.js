const http = require('http');

const runTest = () => {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username: 'admin', password: 'securepassword' });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          console.log('Login Response:', body);
          const parsed = JSON.parse(body);
          if (parsed.token) {
            // Test ME route with token
            const meReq = http.request(
              {
                hostname: 'localhost',
                port: 5000,
                path: '/api/auth/me',
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${parsed.token}`,
                },
              },
              (meRes) => {
                let meBody = '';
                meRes.on('data', (c) => (meBody += c));
                meRes.on('end', () => {
                  console.log('Me Response:', meBody);
                  resolve();
                });
              }
            );
            meReq.end();
          } else {
            resolve();
          }
        });
      }
    );
    req.write(data);
    req.end();
  });
};

const runInvalid = () => {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username: 'admin', password: 'wrong' });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          console.log('Invalid Login Response:', body);
          resolve();
        });
      }
    );
    req.write(data);
    req.end();
  });
};

const runNoToken = () => {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          console.log('No Token Response:', body);
          resolve();
        });
      }
    );
    req.end();
  });
};

async function main() {
  await runInvalid();
  await runNoToken();
  await runTest();
}

main();
