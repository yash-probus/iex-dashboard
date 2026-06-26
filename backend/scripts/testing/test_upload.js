const fs = require('fs');

async function main() {
  console.log('--- Starting Upload Tests ---');

  // 1. Get Token
  console.log('\\n1. Logging in to get token...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'securepassword' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful:', !!token);

  // 2. Health Check
  console.log('\\n2. Testing /api/uploads/health...');
  const healthRes = await fetch('http://localhost:5000/api/uploads/health', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Health Check:', await healthRes.json());

  // Helper for Multipart requests
  const uploadFile = async (filePath, market, date, expectedStatus) => {
    const formData = new FormData();
    formData.append('market', market);
    formData.append('date', date);
    
    // Read file as Blob
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);
    const fileName = filePath.split('/').pop() || filePath;
    formData.append('file', blob, fileName);

    const res = await fetch('http://localhost:5000/api/uploads', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const data = await res.json();
    console.log(`Upload ${fileName}: Status ${res.status} | Response:`, data);
  };

  // 3. Test Unauthorized
  console.log('\\n3. Testing Auth Protection (No Token)...');
  const unauthRes = await fetch('http://localhost:5000/api/uploads', {
    method: 'POST',
    body: new FormData()
  });
  console.log('No Token Response:', await unauthRes.json());

  // 4. Test Invalid Extension
  console.log('\\n4. Testing Extension Validation (test.exe)...');
  await uploadFile('test.exe', 'DAM', '2026-06-22', 400);

  // 5. Test File Size Limit
  console.log('\\n5. Testing File Size Validation (large.csv)...');
  await uploadFile('large.csv', 'GDAM', '2026-06-22', 400);

  // 6. Test Successful Upload
  console.log('\\n6. Testing Successful Upload (dummy.csv)...');
  await uploadFile('dummy.csv', 'RTM', '2026-06-22', 200);
}

main().catch(console.error);
