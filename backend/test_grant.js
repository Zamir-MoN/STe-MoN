const axios = require('axios');

async function test() {
  try {
    // 1. Login as admin
    const loginRes = await axios.post('http://65.1.84.238:3001/api/auth/login', {
      username: 'admin',
      password: 'valqore2026',
      hwid: 'test'
    });
    const token = loginRes.data.token;
    console.log('Logged in as admin. Token:', token.substring(0, 10) + '...');

    // 2. Try to grant selective access with undefined/invalid account_id
    const grantRes = await axios.post('http://65.1.84.238:3001/api/auth/users/1/selective-access', {
      account_id: null // passing null or undefined to simulate missing account
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Grant Response:', grantRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
