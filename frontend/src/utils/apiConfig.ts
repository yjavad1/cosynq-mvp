/**
 * BULLETPROOF API Configuration for Railway Production Deployment
 * 
 * This configuration MUST work correctly in both:
 * - Local development (with Vite dev server proxy)
 * - Railway production (same-origin API calls)
 */

// Environment detection functions
function isProduction(): boolean {
  // Multiple checks to ensure we detect production correctly
  return (
    import.meta.env.PROD === true ||
    import.meta.env.MODE === 'production' ||
    window.location.hostname.includes('railway.app') ||
    window.location.hostname.includes('up.railway.app')
  );
}

function isDevelopment(): boolean {
  return (
    import.meta.env.DEV === true ||
    import.meta.env.MODE === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000'
  );
}

// Get the base API URL based on environment
export function getApiBaseUrl(): string {
  const env = {
    prod: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    hostname: window.location.hostname,
    port: window.location.port,
    origin: window.location.origin,
    viteApiUrl: import.meta.env.VITE_API_URL
  };
  
  console.log('🔧 Environment Detection:', env);
  
  // PRODUCTION: Use same-origin API calls (Railway deployment)
  if (isProduction()) {
    console.log('✅ PRODUCTION MODE: Using same-origin API calls');
    return '/api';
  }
  
  // DEVELOPMENT: Use configured API URL or localhost
  if (isDevelopment()) {
    const devUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    console.log('🛠️ DEVELOPMENT MODE: Using dev API URL:', devUrl);
    return devUrl;
  }
  
  // FALLBACK: If environment detection fails, assume production
  console.warn('⚠️ Environment detection unclear, defaulting to production mode');
  return '/api';
}

// Create a full API URL for a given endpoint
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  let finalUrl: string;
  
  // For same-origin calls (production), ensure we don't double-add /api
  if (baseUrl === '/api') {
    finalUrl = `/api/${cleanEndpoint}`;
  } else {
    // For full URL calls (development)
    finalUrl = `${baseUrl}/${cleanEndpoint}`;
  }
  
  console.log(`🌐 API URL: ${endpoint} → ${finalUrl}`);
  return finalUrl;
}

// Debug logging for environment detection
export function logApiConfig(): void {
  const config = {
    // Vite environment
    vite: {
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      dev: import.meta.env.DEV,
      viteApiUrl: import.meta.env.VITE_API_URL
    },
    // Browser environment
    browser: {
      hostname: window.location.hostname,
      port: window.location.port,
      origin: window.location.origin,
      href: window.location.href,
      protocol: window.location.protocol
    },
    // Node environment (not available in browser)
    node: {
      nodeEnv: 'browser-environment'
    },
    // Detection results
    detection: {
      isProduction: isProduction(),
      isDevelopment: isDevelopment()
    },
    // Final configuration
    result: {
      baseUrl: getApiBaseUrl()
    }
  };
  
  console.log('🔧 COMPLETE API Configuration:', config);
}

// Test API connectivity with detailed logging
export async function testApiConnection(): Promise<boolean> {
  try {
    const testUrl = getApiUrl('health'); // Use health endpoint for testing
    console.log('🧪 Testing API connection to:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const success = response.ok;
    const result = {
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    console.log(`🧪 API Test Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`, result);
    
    if (!success) {
      const text = await response.text();
      console.error('🧪 Response body:', text);
    }
    
    return success;
  } catch (error) {
    console.error('🧪 API Test Error:', error);
    console.error('🧪 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
}

// Force API configuration logging on module load
logApiConfig();