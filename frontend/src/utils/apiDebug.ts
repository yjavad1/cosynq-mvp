/**
 * API Debug utility for Railway deployment debugging
 */

import { getApiUrl, getApiBaseUrl, logApiConfig, testApiConnection } from './apiConfig';

export async function runApiDiagnostics(): Promise<void> {
  console.log('🔍 === API DIAGNOSTICS START ===');
  
  // 1. Log complete environment information
  logApiConfig();
  
  // 2. Test basic URL generation
  console.log('🧪 Testing URL Generation:');
  console.log('  Base URL:', getApiBaseUrl());
  console.log('  Login URL:', getApiUrl('auth/login'));
  console.log('  Analytics URL:', getApiUrl('analytics'));
  console.log('  Health URL:', getApiUrl('health'));
  
  // 3. Test fetch to different endpoints
  console.log('🧪 Testing Fetch Calls:');
  
  const testEndpoints = [
    'health',
    'auth/login', // This will fail but shows URL resolution
    'analytics'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      const url = getApiUrl(endpoint);
      console.log(`  Testing ${endpoint}:`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  ✅ ${endpoint}:`, response.status, response.statusText);
    } catch (error) {
      console.error(`  ❌ ${endpoint}:`, error);
    }
  }
  
  // 4. Test API connection
  console.log('🧪 Testing API Connection:');
  const connected = await testApiConnection();
  console.log('  Connection result:', connected ? '✅ SUCCESS' : '❌ FAILED');
  
  console.log('🔍 === API DIAGNOSTICS END ===');
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  console.log('🔧 Running API diagnostics in development mode...');
  runApiDiagnostics().catch(console.error);
}