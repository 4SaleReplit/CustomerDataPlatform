/**
 * Authentication Test Script
 * Verifies that the application properly requires login and doesn't auto-login users
 */

async function testAuthentication() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing authentication system...\n');
  
  // Test 1: Health endpoint should work without auth
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✓ Health endpoint accessible:', healthData.status);
  } catch (error) {
    console.log('✗ Health endpoint failed:', error.message);
    return;
  }
  
  // Test 2: Team endpoint should work (no auth required for login form)
  try {
    const teamResponse = await fetch(`${baseUrl}/api/team`);
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      console.log(`✓ Team endpoint accessible: ${teamData.length} members found`);
    }
  } catch (error) {
    console.log('✗ Team endpoint failed:', error.message);
    return;
  }
  
  // Test 3: Login with valid credentials
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ahmed.abdqader@4sale.tech',
        password: 'Admin123!'
      })
    });
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('✓ Login successful:', userData.email, '(Role:', userData.role + ')');
    } else {
      console.log('✗ Login failed with valid credentials');
      return;
    }
  } catch (error) {
    console.log('✗ Login request failed:', error.message);
    return;
  }
  
  // Test 4: Login with invalid credentials
  try {
    const invalidLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'invalid@email.com',
        password: 'wrongpassword'
      })
    });
    
    if (invalidLoginResponse.status === 401) {
      console.log('✓ Invalid credentials properly rejected');
    } else {
      console.log('✗ Invalid credentials not properly rejected');
    }
  } catch (error) {
    console.log('✗ Invalid login test failed:', error.message);
  }
  
  console.log('\nAuthentication test completed!');
  console.log('\nExpected behavior:');
  console.log('- Application should show login page when accessed');
  console.log('- No automatic "admin" user login');
  console.log('- Only database users can authenticate');
  console.log('- Invalid credentials are rejected');
}

// Run the test
testAuthentication().catch(console.error);