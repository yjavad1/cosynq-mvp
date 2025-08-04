# Cosynq Deployment Guide

This guide will help you deploy your Cosynq authentication system to production using Railway.

## 🚀 Railway Deployment (Recommended)

Railway provides an excellent platform for full-stack applications with built-in database hosting.

### Prerequisites

1. [Railway Account](https://railway.app) (free tier available)
2. [GitHub Account](https://github.com) 
3. Git repository pushed to GitHub

### Step 1: Database Setup

#### Option A: Railway MongoDB Plugin (Recommended)
1. Go to [railway.app](https://railway.app) and create a new project
2. Click "Add Service" → "Database" → "MongoDB"
3. Railway will automatically provision a MongoDB instance
4. Copy the connection string from the MongoDB service variables

#### Option B: MongoDB Atlas
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Whitelist Railway's IP addresses or use `0.0.0.0/0` for development

### Step 2: Backend Deployment

1. **Create Backend Service**
   ```bash
   # In Railway dashboard
   - Click "New Project"
   - Connect GitHub repository
   - Select "Deploy from GitHub repo"
   - Choose your repository
   ```

2. **Configure Build Settings**
   ```bash
   # Railway will auto-detect, but you can override:
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```bash
   PORT=8000
   NODE_ENV=production
   MONGODB_URI=mongodb://mongo:password@containers-us-west-xxx.railway.app:6543/railway
   JWT_SECRET=your-64-character-secure-random-string
   BCRYPT_ROUNDS=12
   FRONTEND_URL=https://your-frontend-domain.railway.app
   ```

4. **Generate Secure JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Step 3: Frontend Deployment

1. **Create Frontend Service**
   ```bash
   # In the same Railway project
   - Click "Add Service" → "GitHub Repo"
   - Select the same repository
   - Set root directory to "frontend"
   ```

2. **Configure Build Settings**
   ```bash
   Root Directory: frontend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```bash
   VITE_API_URL=https://your-backend-domain.railway.app/api
   ```

### Step 4: Custom Domains (Optional)

1. **Backend Domain**
   ```bash
   # In Railway backend service
   - Go to "Settings" → "Domains"
   - Add custom domain: api.yourapp.com
   ```

2. **Frontend Domain**
   ```bash
   # In Railway frontend service
   - Go to "Settings" → "Domains" 
   - Add custom domain: yourapp.com
   ```

## 🔧 Environment Variables Reference

### Backend (.env)
```bash
PORT=8000
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-64-character-secure-jwt-secret
BCRYPT_ROUNDS=12
FRONTEND_URL=https://your-frontend-url.railway.app
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.railway.app/api
```

## 🗄️ Alternative Database Options

### MongoDB Atlas
```bash
# Connection string format:
mongodb+srv://username:password@cluster.mongodb.net/cosynq?retryWrites=true&w=majority
```

### Railway PostgreSQL (Alternative)
If you prefer PostgreSQL, you can:
1. Use Railway's PostgreSQL plugin
2. Update the backend to use Prisma or TypeORM
3. Convert Mongoose schemas to SQL schemas

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different JWT secrets for each environment
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Enable IP whitelisting when possible
   - Regular backups

3. **CORS Configuration**
   - Update CORS origins for production domains
   - Remove localhost origins in production

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs in Railway dashboard
   # Ensure all dependencies are in package.json
   # Verify TypeScript compilation
   ```

2. **Database Connection Issues**
   ```bash
   # Verify MONGODB_URI format
   # Check network connectivity
   # Ensure database is accessible from Railway
   ```

3. **CORS Errors**
   ```bash
   # Update FRONTEND_URL in backend env vars
   # Check CORS middleware configuration
   # Verify domain spelling and protocol (https)
   ```

4. **Environment Variables Not Loading**
   ```bash
   # Check variable names (case sensitive)
   # Restart services after adding variables
   # Verify no extra spaces in values
   ```

## 📊 Monitoring & Logs

1. **Railway Logs**
   ```bash
   # View real-time logs in Railway dashboard
   # Monitor build and runtime logs
   # Set up log alerts
   ```

2. **Health Checks**
   ```bash
   # Backend health: https://your-backend.railway.app/api/health
   # Frontend health: https://your-frontend.railway.app
   ```

## 🔄 CI/CD Pipeline

Railway automatically deploys when you push to your connected GitHub branch:

1. **Automatic Deployments**
   ```bash
   git push origin main  # Triggers automatic deployment
   ```

2. **Manual Deployments**
   ```bash
   # Use Railway CLI or dashboard to trigger manual deploys
   railway deploy
   ```

## 💰 Cost Optimization

1. **Railway Free Tier**
   - $5/month credit
   - Suitable for development and small apps
   - Auto-sleep for inactive services

2. **Production Recommendations**
   - Monitor usage in Railway dashboard
   - Optimize build times
   - Use Railway's scaling features

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain Setup**
2. **SSL Certificate Configuration** (automatic with Railway)
3. **Performance Monitoring**
4. **Backup Strategy**
5. **User Analytics Setup**

Your Cosynq authentication system is now production-ready! 🎉

## 📞 Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- MongoDB Atlas Support: https://www.mongodb.com/support