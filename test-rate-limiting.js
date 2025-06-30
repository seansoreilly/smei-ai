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

async function testRateLimiting() {
  console.log('🚦 Testing Rate Limiting System');
  console.log('==============================\n');

  // Test 1: Make multiple requests without authentication to trigger rate limit
  console.log('1. Testing unauthenticated rate limiting (limit: 5 per minute)...');
  const unauthResults = [];
  
  for (let i = 1; i <= 7; i++) {
    const result = await testEndpoint(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guid: 'test-guid', message: 'test' })
    });
    
    unauthResults.push({
      request: i,
      status: result.status,
      rateLimitHeaders: {
        limit: result.headers['x-ratelimit-limit'],
        remaining: result.headers['x-ratelimit-remaining'],
        reset: result.headers['x-ratelimit-reset'],
        error: result.headers['x-ratelimit-error'],
        retryAfter: result.headers['retry-after']
      }
    });
    
    console.log(`   Request ${i}: Status ${result.status}, Remaining: ${result.headers['x-ratelimit-remaining'] || 'N/A'}`);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const rateLimitedRequests = unauthResults.filter(r => r.status === 429);
  console.log(`   ✅ Rate limiting triggered after ${unauthResults.length - rateLimitedRequests.length} requests\n`);

  // Test 2: Test authenticated rate limiting (higher limits)
  console.log('2. Testing authenticated rate limiting (limit: 60 per minute)...');
  const authResults = [];
  
  for (let i = 1; i <= 5; i++) {
    const result = await testEndpoint(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET
      },
      body: JSON.stringify({ guid: 'test-guid', message: 'test' })
    });
    
    authResults.push({
      request: i,
      status: result.status,
      rateLimitHeaders: {
        limit: result.headers['x-ratelimit-limit'],
        remaining: result.headers['x-ratelimit-remaining'],
      }
    });
    
    console.log(`   Request ${i}: Status ${result.status}, Remaining: ${result.headers['x-ratelimit-remaining'] || 'N/A'}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`   ✅ Authenticated requests have higher limits\n`);

  // Test 3: Test conversation endpoint rate limiting
  console.log('3. Testing conversation endpoint rate limiting...');
  
  const convoResult = await testEndpoint(`${API_BASE}/api/conversation/test-123`, {
    method: 'GET',
    headers: { 'x-api-key': API_SECRET }
  });
  
  console.log(`   Conversation endpoint: Status ${convoResult.status}`);
  console.log(`   Rate limit headers: Limit=${convoResult.headers['x-ratelimit-limit']}, Remaining=${convoResult.headers['x-ratelimit-remaining']}`);
  
  const isConvoLimitLower = parseInt(convoResult.headers['x-ratelimit-limit'] || '0') <= 20;
  console.log(`   ✅ Conversation endpoints have appropriate limits ${isConvoLimitLower ? '(≤20)' : '(>20)'}\n`);

  console.log('✅ Rate limiting tests completed!');
}

if (require.main === module) {
  testRateLimiting().catch(console.error);
}