# Railway Backend Debugging Guide

## 🚨 Issue: "Route not found" for all API endpoints

The backend is responding but returning "Route not found" for authentication endpoints like `/api/auth/register` and `/api/auth/login`.

## ✅ Local Testing Results

**All routes work perfectly locally:**
- ✅ `GET /api/health` - Returns route list
- ✅ `POST /api/auth/register` - Creates user successfully  
- ✅ `POST /api/auth/login` - Authentication works
- ✅ Route registration logging shows all routes are registered

## 🔧 Debug Features Added

### 1. Enhanced Logging
- Route registration logging during startup
- Request logging for all incoming requests
- CORS debugging with origin checking
- 404 error logging with request details

### 2. Debug Endpoints
- `GET /api/routes` - Lists all registered routes
- `GET /api/health` - Shows available endpoints and environment info
- `GET /` - Root health check

### 3. CORS Fixes
- Temporarily allows all origins in production for debugging
- Logs CORS decisions for troubleshooting
- Added common Railway URL patterns

## 🚀 Testing the Fix

### Step 1: Check Deployment Logs
After pushing the updated code, check Railway logs for:

```
🔧 Registering auth routes...
✅ POST /register route registered
✅ POST /login route registered
✅ GET /profile route registered (protected)
✅ POST /logout route registered (protected)
🚀 All auth routes registered successfully
🔧 Registering API routes...
✅ Auth routes registered at /api/auth
✅ Health route registered at /api/health
🚀 All API routes registered successfully
```

### Step 2: Test Debug Endpoints
```bash
# Test health endpoint
curl https://your-backend.railway.app/api/health

# Test routes listing
curl https://your-backend.railway.app/api/routes

# Test root endpoint
curl https://your-backend.railway.app/
```

### Step 3: Check CORS Logs
Look for CORS logging in Railway deployment logs:
```
🔧 CORS check for origin: https://your-frontend.railway.app
✅ CORS: Origin allowed
```

### Step 4: Test Authentication Endpoints
```bash
# Test registration
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

## 🔍 Potential Railway-Specific Issues

### Issue 1: Build Process
**Problem**: Railway might not be building correctly
**Solution**: Check build logs for TypeScript compilation errors

### Issue 2: File Inclusion
**Problem**: Built JavaScript files might not include all routes
**Solution**: Verify `dist/` folder contains all compiled files

### Issue 3: Environment Variables
**Problem**: Missing environment variables causing middleware issues
**Solution**: Ensure `NODE_ENV=production` is set in Railway

### Issue 4: Port Binding
**Problem**: Railway might not be binding to the correct port
**Solution**: Railway should auto-inject `PORT` environment variable

### Issue 5: Module Resolution
**Problem**: Shared types or modules not found in production
**Solution**: Check if `shared/` directory is properly copied and referenced

## 🛠️ Railway Configuration Check

### Environment Variables Required:
```bash
NODE_ENV=production
PORT=8000  # (Usually auto-set by Railway)
MONGODB_URI=mongodb://...
JWT_SECRET=your-production-secret
BCRYPT_ROUNDS=12
FRONTEND_URL=https://your-frontend.railway.app
```

### Build Command:
```bash
npm install --prefer-offline --no-audit --progress=false --legacy-peer-deps && npm run build
```

### Start Command:
```bash
npm start
```

## 📊 Expected vs Actual Behavior

### Expected (Working Locally):
1. Server starts and shows route registration logs
2. `/api/health` returns route list
3. `/api/auth/register` accepts POST requests
4. `/api/auth/login` accepts POST requests
5. CORS allows frontend requests

### Actual on Railway:
1. Server starts (✅)
2. All requests return "Route not found" (❌)

## 🎯 Next Steps

1. **Push updated code** with debug logging
2. **Check Railway deployment logs** for route registration
3. **Test debug endpoints** to verify route registration
4. **Check CORS behavior** with frontend requests
5. **Verify build output** includes all necessary files

## 🚨 Emergency Fallback

If routing still fails, create a simple test route:

```javascript
// Add to src/index.ts before other routes
app.get('/test', (req, res) => {
  res.json({ message: 'Direct route works' });
});
```

This will help determine if the issue is with Express routing or the modular route structure.

Your backend should now provide detailed logging to help identify the Railway deployment issue! 🔍