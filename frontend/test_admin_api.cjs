const axios = require('axios');

async function testApi() {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    // 1. Login to get token
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'securepassword'
    });
    
    const token = loginRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    // 2. GET /datasets/summary
    const summaryRes = await axios.get(`${baseURL}/datasets/summary`, config);
    console.log('--- GET /datasets/summary ---');
    console.log(JSON.stringify(summaryRes.data, null, 2));
    
    // 3. GET /datasets
    const datasetsRes = await axios.get(`${baseURL}/datasets`, config);
    console.log('\n--- GET /datasets ---');
    console.log(JSON.stringify(datasetsRes.data, null, 2));
    
    // 4. GET /upload-history
    const historyRes = await axios.get(`${baseURL}/upload-history`, config);
    console.log('\n--- GET /upload-history ---');
    console.log(JSON.stringify(historyRes.data, null, 2));
    
  } catch (err) {
    console.error('API Test Failed:');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testApi();
