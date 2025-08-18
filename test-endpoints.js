/**
 * Comprehensive endpoint testing for Railway deployment verification
 */

const baseUrl = process.argv[2] || 'http://localhost:3001';

console.log(`🧪 Testing API endpoints against: ${baseUrl}`);

const testEndpoints = [
  // Public endpoints
  { method: 'GET', path: '/api/health', expectSuccess: true, description: 'Health check' },
  { method: 'POST', path: '/api/auth/login', body: { email: 'test@test.com', password: 'wrong' }, expectSuccess: false, description: 'Login (invalid creds)' },
  { method: 'GET', path: '/api/analytics?timeRange=7d', expectSuccess: true, description: 'Analytics (public)' },
  
  // Protected endpoints (should fail without auth)
  { method: 'GET', path: '/api/contacts', expectSuccess: false, description: 'Contacts (protected)' },
  { method: 'GET', path: '/api/spaces', expectSuccess: false, description: 'Spaces (protected)' },
  { method: 'GET', path: '/api/bookings', expectSuccess: false, description: 'Bookings (protected)' },
  { method: 'GET', path: '/api/locations', expectSuccess: false, description: 'Locations (protected)' },
  
  // WhatsApp endpoints (if enabled)
  { method: 'GET', path: '/api/whatsapp/status', expectSuccess: false, description: 'WhatsApp status (protected)' },
];

async function testEndpoint(test) {
  try {
    console.log(`\n🔍 Testing: ${test.method} ${test.path} - ${test.description}`);
    
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (test.body) {
      options.body = JSON.stringify(test.body);
    }
    
    const response = await fetch(`${baseUrl}${test.path}`, options);
    const isSuccess = response.ok;
    const data = await response.json();
    
    const testPassed = test.expectSuccess ? isSuccess : !isSuccess;
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Expected: ${test.expectSuccess ? 'Success' : 'Failure'}`);
    console.log(`  Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (response.ok && data) {
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else if (data && data.message) {
      console.log(`  Message: ${data.message}`);
    }
    
    return testPassed;
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n🚀 Starting API endpoint tests...`);
  
  let passed = 0;
  let total = testEndpoints.length;
  
  for (const test of testEndpoints) {
    const result = await testEndpoint(test);
    if (result) passed++;
  }
  
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`  Passed: ${passed}/${total}`);
  console.log(`  Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log(`\n✅ ALL TESTS PASSED - API is working correctly!`);
    process.exit(0);
  } else {
    console.log(`\n❌ SOME TESTS FAILED - Check the endpoints above`);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with fetch support');
  process.exit(1);
}

runTests().catch(console.error);