# Railway Deployment Setup - Fixed Configuration

## 🚀 Deploy as Separate Services

Your project is now configured to deploy backend and frontend as separate Railway services.

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub repository

### Step 2: Deploy Backend Service

1. **Create Backend Service**
   - In Railway dashboard, your repo should be connected
   - Railway will detect the `backend/` directory automatically
   - Set **Root Directory**: `backend`

2. **Configure Backend Build**
   ```bash
   # Railway should auto-detect from nixpacks.toml, but if needed:
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Set Backend Environment Variables**
   ```bash
   PORT=8000
   NODE_ENV=production
   MONGODB_URI=mongodb://mongo:password@containers-us-west-xxx.railway.app:6543/railway
   JWT_SECRET=f3696060372ac6622247632ea26ada649779b076ea11a6dfa35e9296f17909142c6a64903b4cfb8f2e511e5abfe791c9e02310bfdd3eec609ad32d698c921802
   BCRYPT_ROUNDS=12
   FRONTEND_URL=https://your-frontend-domain.railway.app
   ```

4. **Get Backend URL**
   - After deployment, copy the Railway-generated URL (e.g., `https://backend-production-xxxx.up.railway.app`)

### Step 3: Add MongoDB Database

1. **In the same Railway project**
   - Click "Add Service"
   - Select "Database" → "MongoDB"
   - Railway will provision a MongoDB instance

2. **Get MongoDB Connection String**
   - Go to MongoDB service → Variables tab
   - Copy the `MONGO_URL` variable
   - Update backend `MONGODB_URI` with this value

### Step 4: Deploy Frontend Service

1. **Add Frontend Service**
   - In the same Railway project, click "Add Service"
   - Select "GitHub Repo" (same repository)
   - Set **Root Directory**: `frontend`

2. **Configure Frontend Build**
   ```bash
   # Railway should auto-detect from nixpacks.toml, but if needed:
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Set Frontend Environment Variables**
   ```bash
   VITE_API_URL=https://your-backend-domain.railway.app/api
   PORT=3000
   ```

### Step 5: Update CORS Configuration

1. **Update Backend Environment**
   - Go to backend service → Variables
   - Set `FRONTEND_URL` to your frontend Railway URL
   - Example: `https://frontend-production-xxxx.up.railway.app`

### Step 6: Test the Deployment

1. **Backend Health Check**
   ```bash
   curl https://your-backend-domain.railway.app/api/health
   ```

2. **Frontend Access**
   ```bash
   # Visit your frontend URL
   https://your-frontend-domain.railway.app
   ```

## 🔧 Configuration Files Summary

Your project now includes:

### Backend Configuration
- `backend/nixpacks.toml` - Railway build configuration
- `backend/railway.json` - Railway deployment settings
- `backend/Procfile` - Process definition
- `backend/.railwayignore` - Files to ignore during deployment
- `backend/shared/` - Local copy of shared types

### Frontend Configuration  
- `frontend/nixpacks.toml` - Railway build configuration
- `frontend/railway.json` - Railway deployment settings
- `frontend/Procfile` - Process definition
- `frontend/.railwayignore` - Files to ignore during deployment
- `frontend/shared/` - Local copy of shared types

### Build Scripts
- **Backend**: `npm start` runs the compiled Express server
- **Frontend**: `npm start` runs Vite preview server on configured port

## 🚨 Troubleshooting

### Build Failures
1. **Check build logs** in Railway dashboard
2. **Verify dependencies** are in package.json
3. **Test builds locally** first:
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```

### Environment Variables
1. **Check variable names** (case sensitive)
2. **No extra spaces** in values
3. **Restart services** after updating variables

### CORS Issues
1. **Update FRONTEND_URL** in backend environment
2. **Check protocol** (https vs http)
3. **Verify domain spelling**

## 📊 Expected Results

After successful deployment:
- **Backend**: RESTful API running on Railway
- **Frontend**: React SPA running on Railway  
- **Database**: MongoDB hosted on Railway
- **HTTPS**: Automatic SSL certificates
- **Custom Domains**: Optional upgrade

## 🔄 Automatic Deployments

Railway will automatically deploy when you push to your main branch:
```bash
git add .
git commit -m "Update application"
git push origin main
```

Your authentication system is now ready for production! 🎉