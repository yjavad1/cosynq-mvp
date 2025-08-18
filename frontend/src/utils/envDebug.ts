/**
 * Environment debugging utility for Railway deployment
 * Call this in the browser console to debug API connectivity issues
 */

import { logApiConfig, getApiUrl } from './apiConfig';

// Global debugging function for browser console
(window as any).debugCosynqEnv = async function() {
  console.log('🚀 Cosynq Environment Debug');
  console.log('==========================');
  
  // API Configuration
  logApiConfig();
  
  // Test specific endpoints
  console.log('\n🧪 Testing API Endpoints:');
  
  const endpoints = [
    'analytics?timeRange=7d',
    'whatsapp/status', 
    'contacts/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = getApiUrl(endpoint);
      console.log(`\n📡 Testing ${endpoint}:`);
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Success: ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`   Error: ❌ ${error}`);
    }
  }
  
  console.log('\n🔗 Network Information:');
  console.log(`   Origin: ${window.location.origin}`);
  console.log(`   Hostname: ${window.location.hostname}`);
  console.log(`   Protocol: ${window.location.protocol}`);
  console.log(`   Port: ${window.location.port || 'default'}`);
  
  console.log('\nℹ️ Run this function in browser console to debug API issues');
  console.log('   Usage: debugCosynqEnv()');
};

console.log('🔧 Environment debug utility loaded. Run debugCosynqEnv() in console to debug API connectivity.');