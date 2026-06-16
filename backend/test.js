async function test() {
  try {
    // 1. Log in as admin
    let res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'zamir', password: 'zamir' })
    });
    let data = await res.json();
    const adminToken = data.token;
    
    res = await fetch('http://localhost:3001/api/accounts', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Admin accounts:', await res.json());

    // 2. Create normal user
    await fetch('http://localhost:3001/api/auth/create-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ username: 'user1', password: 'user1', role: 'user' })
    });

    // 3. Log in as normal user
    res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user1', password: 'user1' })
    });
    data = await res.json();
    const userToken = data.token;

    // 4. Fetch accounts
    res = await fetch('http://localhost:3001/api/accounts', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('User accounts:', await res.json());
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
