#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';
const API_SECRET = process.env.API_SECRET || 'test-secret-key';

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 'ERROR',
      data: error.message
    };
  }
}

async function runAuthTests() {
  console.log('🔐 Testing Authentication System');
  console.log('================================\n');

  // Test 1: Access protected endpoint without authentication
  console.log('1. Testing access without authentication...');
  const noAuthResult = await testEndpoint(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guid: 'test-guid', message: 'test' })
  });
  console.log(`   Status: ${noAuthResult.status} ${noAuthResult.status === 401 ? '✅' : '❌'}`);
  console.log(`   Response: ${JSON.stringify(noAuthResult.data)}\n`);

  // Test 2: Access protected endpoint with invalid API key
  console.log('2. Testing access with invalid API key...');
  const invalidKeyResult = await testEndpoint(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': 'invalid-key'
    },
    body: JSON.stringify({ guid: 'test-guid', message: 'test' })
  });
  console.log(`   Status: ${invalidKeyResult.status} ${invalidKeyResult.status === 401 ? '✅' : '❌'}`);
  console.log(`   Response: ${JSON.stringify(invalidKeyResult.data)}\n`);

  // Test 3: Access protected endpoint with valid API key
  console.log('3. Testing access with valid API key...');
  const validKeyResult = await testEndpoint(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': API_SECRET
    },
    body: JSON.stringify({ guid: 'test-guid-123', message: 'Hello, this is a test message' })
  });
  console.log(`   Status: ${validKeyResult.status} ${validKeyResult.status !== 401 ? '✅' : '❌'}`);
  console.log(`   Response: ${typeof validKeyResult.data === 'string' ? 'Stream response' : JSON.stringify(validKeyResult.data)}\n`);

  // Test 4: Test public endpoints (should not require auth)
  console.log('4. Testing public login endpoint...');
  const publicResult = await testEndpoint(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password' })
  });
  console.log(`   Status: ${publicResult.status} ${publicResult.status === 200 ? '✅' : '❌'}`);
  console.log(`   Response: ${JSON.stringify(publicResult.data)}\n`);

  // Test 5: Test other protected endpoints
  console.log('5. Testing other protected endpoints...');
  
  const endpoints = [
    { path: '/api/conversation/test-123', method: 'GET' },
    { path: '/api/messages/test-123', method: 'GET' },
    { path: '/api/resources/products', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(`${API_BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: { 'x-api-key': API_SECRET }
    });
    console.log(`   ${endpoint.method} ${endpoint.path}: ${result.status} ${result.status !== 401 ? '✅' : '❌'}`);
  }

  console.log('\n✅ Authentication tests completed!');
}

if (require.main === module) {
  runAuthTests().catch(console.error);
}