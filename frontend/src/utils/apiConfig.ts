/**
 * API Configuration utility for development vs production environments
 */

// Get the base API URL based on environment
export function getApiBaseUrl(): string {
  // In production, use same-origin API calls (Railway serves both frontend and backend)
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, use the configured API URL or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
}

// Create a full API URL for a given endpoint
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // For same-origin calls (production), ensure we don't double-add /api
  if (baseUrl === '/api') {
    return `/api/${cleanEndpoint}`;
  }
  
  // For full URL calls (development)
  return `${baseUrl}/${cleanEndpoint}`;
}

// Debug logging for environment detection
export function logApiConfig(): void {
  console.log('🔧 API Configuration:', {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    baseUrl: getApiBaseUrl(),
    viteApiUrl: import.meta.env.VITE_API_URL,
    location: window.location.href,
    origin: window.location.origin,
  });
}

// Test API connectivity
export async function testApiConnection(): Promise<boolean> {
  try {
    const testUrl = getApiUrl('analytics?timeRange=7d');
    console.log('🧪 Testing API connection to:', testUrl);
    
    const response = await fetch(testUrl);
    const success = response.ok;
    
    console.log(`🧪 API Test Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`, {
      status: response.status,
      statusText: response.statusText,
      url: testUrl,
    });
    
    return success;
  } catch (error) {
    console.error('🧪 API Test Error:', error);
    return false;
  }
}