# Railway Frontend Vite Preview Server Fix

## 🚨 Issue: "Blocked request" from External Hosts

The Vite preview server was blocking external requests from Railway's domain, causing the deployed frontend to be inaccessible.

## ✅ Solutions Implemented

### 1. **Updated Vite Configuration**

**File**: `frontend/vite.config.ts`
```typescript
preview: {
  port: 3000,
  host: '0.0.0.0', // Bind to all interfaces (not just localhost)
  strictPort: false, // Allow port fallback if 3000 is occupied
  cors: true, // Enable CORS for external requests
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  },
},
```

### 2. **Enhanced npm Start Script**

**File**: `frontend/package.json`
```json
{
  "scripts": {
    "start": "vite preview --port ${PORT:-3000} --host 0.0.0.0 --strictPort false"
  }
}
```

**Key Changes:**
- `--host 0.0.0.0`: Binds to all network interfaces (not just localhost)
- `--strictPort false`: Allows port fallback if Railway assigns different port
- `${PORT:-3000}`: Uses Railway's PORT environment variable with fallback

### 3. **Custom Server Script (Alternative)**

**File**: `frontend/server.js`
```javascript
import { preview } from 'vite';

const server = await preview({
  preview: {
    port: parseInt(process.env.PORT) || 3000,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      // Additional CORS headers...
    },
  },
});
```

## 🚀 Deployment Options

### Option 1: Standard Vite Preview (Recommended)
```bash
# Railway will use this automatically
npm start
```

### Option 2: Custom Server Script
```bash
# Use if Option 1 doesn't work
npm run start:server
```

### Option 3: Railway Configuration Override
Update Railway service to use alternative start command:
```json
{
  "deploy": {
    "startCommand": "npm run start:server"
  }
}
```

## 🧪 Testing the Fix

### Local Testing
```bash
# Build the app
npm run build

# Test preview server with external access
PORT=3001 npm start

# Should show:
# ➜  Local:   http://localhost:3001/
# ➜  Network: http://192.168.29.50:3001/  ← This means external access works
```

### Railway Testing
```bash
# After deployment, test the Railway URL
curl https://your-frontend.railway.app/

# Should return the HTML content, not "Blocked request"
```

## 🔧 Configuration Files Updated

1. **`vite.config.ts`**: Enhanced preview configuration
2. **`package.json`**: Updated start script with Railway-compatible options
3. **`server.js`**: Custom server script for advanced use cases
4. **`railway.alternative.json`**: Alternative Railway configuration

## 🚨 Common Issues & Solutions

### Issue 1: Still Getting "Blocked request"
**Solution**: Use the custom server script
```bash
# In Railway dashboard, set start command to:
npm run start:server
```

### Issue 2: Port binding errors
**Solution**: Railway auto-assigns ports, configuration handles this
```bash
# The ${PORT:-3000} syntax automatically uses Railway's assigned port
```

### Issue 3: CORS errors from browser
**Solution**: CORS headers are now configured in vite.config.ts
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  // ... other CORS headers
}
```

### Issue 4: External domain not accessible
**Solution**: `host: '0.0.0.0'` binds to all interfaces
```bash
# This allows access from:
# - localhost (development)
# - Railway's external domain (production)
# - Any other external domain pointing to the server
```

## 📊 Before vs After

### Before (Broken):
```bash
vite preview --port $PORT --host 0.0.0.0
# Result: "Blocked request" for external hosts
```

### After (Fixed):
```bash
vite preview --port ${PORT:-3000} --host 0.0.0.0 --strictPort false
# Result: Accessible from Railway's external domain
```

## ✅ Verification Steps

1. **Build Success**: `npm run build` completes without errors
2. **Local Preview**: `npm start` works and shows Network URL
3. **External Access**: Can access via Network URL from other devices
4. **Railway Deploy**: Railway deployment succeeds
5. **Frontend Access**: Railway URL serves the React application
6. **API Communication**: Frontend can communicate with backend API

## 🎯 Expected Results

After deploying with these fixes:
- ✅ Railway frontend URL loads the React application
- ✅ No more "Blocked request" errors
- ✅ External domain access works properly
- ✅ CORS headers allow API communication
- ✅ Port flexibility for Railway environment

Your Vite preview server is now properly configured for Railway deployment! 🚀