const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('--- E2E Test: Replacement Workflow ---');
    
    // 1. Login to get token
    console.log('\n[1] Logging in...');
    let loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    
    if (!loginRes.ok) {
        loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'adminpassword' })
        });
    }

    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('Token acquired.');

    const filePath = path.join(__dirname, 'uploads', 'dam', 'dam2.csv');
    const fileStats = fs.statSync(filePath);
    
    const boundary = '----Boundary' + Math.random().toString(36).substring(2);
    
    let bodyData = '';
    bodyData += `--${boundary}\r\n`;
    bodyData += `Content-Disposition: form-data; name="market"\r\n\r\n`;
    bodyData += `DAM\r\n`;
    bodyData += `--${boundary}\r\n`;
    bodyData += `Content-Disposition: form-data; name="deliveryDate"\r\n\r\n`;
    bodyData += `2026-10-01\r\n`;
    bodyData += `--${boundary}\r\n`;
    bodyData += `Content-Disposition: form-data; name="file"; filename="dam2.csv"\r\n`;
    bodyData += `Content-Type: text/csv\r\n\r\n`;
    
    const footer = `\r\n--${boundary}--\r\n`;
    
    // Buffer creation
    const fileBuffer = fs.readFileSync(filePath);
    const bodyBuffer = Buffer.concat([
      Buffer.from(bodyData),
      fileBuffer,
      Buffer.from(footer)
    ]);

    // 2. Upload duplicate (should fail with 409)
    console.log('\n[2] Attempting duplicate upload without ?action=replace...');
    const duplicateRes = await fetch('http://localhost:5000/api/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });
    
    const duplicateData = await duplicateRes.json();
    if (duplicateRes.status === 409) {
      console.log(`SUCCESS: Received HTTP ${duplicateRes.status} -> ${duplicateData.message}`);
    } else {
      console.error(`FAIL: Expected 409, got ${duplicateRes.status} -> ${duplicateData.message}`);
    }

    // 3. Upload with ?action=replace (should succeed)
    console.log('\n[3] Attempting upload with ?action=replace...');
    const replaceRes = await fetch('http://localhost:5000/api/uploads?action=replace', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });
    
    const replaceData = await replaceRes.json();
    if (replaceRes.status === 200) {
      console.log('SUCCESS: Replacement successful!');
      console.log('Response Payload:', replaceData);
    } else {
      console.error(`FAIL: Expected 200, got ${replaceRes.status} -> ${replaceData.message}`);
    }

  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

testUpload();
