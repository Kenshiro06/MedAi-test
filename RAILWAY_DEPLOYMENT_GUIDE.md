# 🚂 Railway + Vercel Deployment Guide - MedAI Platform

## 📋 **Overview**

This guide will help you deploy your MedAI platform using the optimal setup:
- **Frontend**: Vercel (React) - Fast, optimized for React apps
- **Backend**: Railway (Python Flask) - Great for Python APIs with large files

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │───▶│   (Flask API)   │───▶│   (Supabase)    │
│   Vercel        │    │   Railway       │    │   Cloud         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 **Step 1: Deploy Backend on Railway (Python API)**

### **1.1 Create New Railway Project**
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your **MedAI repository**
5. Name it: `medai-backend`

### **1.2 Configure Backend Service**
1. **Root Directory**: Set to `backend`
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `python malaria_api_gradcam.py`

### **1.3 Environment Variables**
Add these environment variables in Railway dashboard:

```bash
# Python Configuration
PYTHON_VERSION=3.10.12
FLASK_ENV=production

# Port (Railway will auto-assign)
PORT=${{RAILWAY_PORT}}

# Optional: TensorFlow optimizations
TF_CPP_MIN_LOG_LEVEL=2
```

### **1.4 Backend Files Structure**
```
backend/
├── malaria_api_gradcam.py          # Main API file
├── malaria_finetune_stage2_tf215.h5 # AI model (120MB)
├── requirements.txt                 # Python dependencies
├── railway.json                     # Railway config
├── Procfile                        # Alternative start command
└── .python-version                 # Python version
```

---

## 🎨 **Step 2: Deploy Frontend on Vercel (React)**

### **2.1 Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your **MedAI GitHub repository**
4. Vercel will auto-detect it's a Vite React app

### **2.2 Configure Build Settings**
Vercel should auto-configure, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### **2.3 Environment Variables**
Add these in Vercel dashboard → Settings → Environment Variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL (your Railway backend URL)
VITE_API_URL=https://medai-backend-production.up.railway.app
```

### **2.4 Deploy**
1. Click **"Deploy"**
2. Vercel will build and deploy automatically
3. Get your frontend URL (e.g., `https://medai.vercel.app`)

---

## ⚙️ **Step 3: Configuration Files**

### **3.1 Backend Railway Config** (`backend/railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python malaria_api_gradcam.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "environments": {
    "production": {
      "variables": {
        "PYTHON_VERSION": "3.10.12",
        "PORT": "$PORT",
        "FLASK_ENV": "production"
      }
    }
  }
}
```

### **3.2 Vercel Config** (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key", 
    "VITE_API_URL": "@vite_api_url"
  }
}
```

---

## 🔧 **Step 4: Update CORS for Vercel Frontend**

After both services are deployed, update your Flask API CORS settings:

### **4.1 Update Backend CORS**
In `backend/malaria_api_gradcam.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
# Allow requests from your Vercel frontend
CORS(app, origins=[
    'https://medai.vercel.app',  # Your Vercel URL
    'https://medai-*.vercel.app',  # Vercel preview deployments
    'http://localhost:5173',  # Local development
    'http://localhost:3000'   # Alternative local port
])
```

### **4.2 Get Your URLs**
- **Backend (Railway)**: `https://medai-backend-production.up.railway.app`
- **Frontend (Vercel)**: `https://medai.vercel.app` (or your custom domain)

---

## 📦 **Step 5: Large File Handling (AI Model)**

Your AI model (`malaria_finetune_stage2_tf215.h5`) is 120MB. Railway handles this automatically, but ensure:

### **5.1 Git LFS Setup** (Already done)
```bash
# Your model is already tracked with Git LFS
git lfs track "*.h5"
```

### **5.2 Verify Model Upload**
Check that the model file is properly uploaded:
```bash
# In Railway logs, you should see:
✅ Model loaded successfully WITH YOUR TRAINED WEIGHTS!
   Model input shape: (None, 256, 256, 3)
   Total parameters: 31,656,769
```

---

## 🚦 **Step 6: Testing Deployment**

### **6.1 Backend Health Check (Railway)**
Test your backend API:
```bash
curl https://your-backend-url.up.railway.app/health
```

### **6.2 Frontend Access (Vercel)**
1. Visit your Vercel URL
2. Test login functionality  
3. Upload a test image in Detector
4. Verify AI predictions work

### **6.3 Integration Test**
- Ensure frontend can communicate with Railway backend
- Test image upload and AI analysis
- Verify PDF generation works
- Check all user roles function properly

---

## 🔒 **Step 7: Security & Environment Setup**

### **7.1 Environment Variables Checklist**

**Backend (Railway):**
- ✅ `PYTHON_VERSION=3.10.12`
- ✅ `FLASK_ENV=production`
- ✅ `PORT=${{RAILWAY_PORT}}`

**Frontend (Vercel):**
- ✅ `VITE_SUPABASE_URL=your-supabase-url`
- ✅ `VITE_SUPABASE_ANON_KEY=your-anon-key`
- ✅ `VITE_API_URL=your-railway-backend-url`

### **7.2 CORS Configuration**
Your Flask API should allow requests from your Vercel domain:

```python
# In malaria_api_gradcam.py
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    'https://medai.vercel.app',
    'https://medai-*.vercel.app',  # Preview deployments
    'http://localhost:5173'        # Local development
])
```

---

## 📊 **Step 8: Monitoring & Performance**

### **8.1 Railway Dashboard (Backend)**
- **Deployments**: Track API build and deployment status
- **Metrics**: Monitor CPU, memory, and network usage
- **Logs**: View real-time Flask application logs
- **Environment**: Manage environment variables

### **8.2 Vercel Dashboard (Frontend)**
- **Deployments**: Automatic deployments on git push
- **Analytics**: Page views, performance metrics
- **Functions**: Monitor serverless function usage
- **Domains**: Custom domain management

### **8.3 Performance Benefits**
- **Vercel**: Global CDN, instant cache invalidation
- **Railway**: Optimized for Python apps, persistent storage
- **Combined**: Best of both platforms

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**1. Model Loading Fails**
```bash
# Check logs for:
❌ Error loading model: [Errno 2] No such file or directory
```
**Solution**: Ensure Git LFS is properly configured and model file is uploaded.

**2. CORS Errors**
```bash
# Frontend console shows:
Access to fetch at 'backend-url' from origin 'frontend-url' has been blocked by CORS
```
**Solution**: Update CORS configuration in Flask app.

**3. Environment Variables Not Set**
```bash
# Check Railway dashboard environment variables
# Ensure all required variables are set
```

**4. Build Failures**
```bash
# Check build logs in Railway dashboard
# Common issues: missing dependencies, wrong Python version
```

---

## 💰 **Pricing Comparison**

### **Railway (Backend):**
- **Free Tier**: $5 credit per month
- **Developer Plan**: $20/month (recommended)
- **Pro Plan**: $50/month (high traffic)

### **Vercel (Frontend):**
- **Hobby Plan**: Free (perfect for most use cases)
- **Pro Plan**: $20/month (custom domains, analytics)
- **Enterprise**: Custom pricing

### **Total Cost:**
- **Development**: Free (Railway free tier + Vercel hobby)
- **Production**: $20/month (Railway developer + Vercel hobby)

---

## 🎯 **Deployment Checklist**

### **Pre-deployment:**
- ✅ Code pushed to GitHub
- ✅ Environment variables documented
- ✅ Model file uploaded via Git LFS
- ✅ Railway configurations created

### **Backend Deployment (Railway):**
- ✅ Railway project created
- ✅ Backend service configured
- ✅ Environment variables set
- ✅ Health check passes

### **Frontend Deployment (Vercel):**
- ✅ Vercel project connected to GitHub
- ✅ Build configuration verified
- ✅ Environment variables set
- ✅ Custom domain configured (optional)

### **Post-deployment:**
- ✅ End-to-end testing completed
- ✅ AI predictions working
- ✅ PDF generation functional
- ✅ Multi-user roles tested

---

## 📞 **Support**

### **Railway Resources:**
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Railway community support
- **GitHub**: Railway examples and templates

### **MedAI Specific:**
- **Model Issues**: Check TensorFlow compatibility
- **API Errors**: Review Flask logs in Railway dashboard
- **Frontend Issues**: Check browser console and network tab

---

## 🎉 **Success!**

Once deployed, your MedAI platform will be accessible at:
- **Frontend**: `https://medai.vercel.app` (or your custom domain)
- **Backend API**: `https://medai-backend-production.up.railway.app`

**Benefits of this setup:**
- ⚡ **Vercel**: Lightning-fast React app with global CDN
- 🐍 **Railway**: Optimized Python environment with large file support
- 💰 **Cost-effective**: Best pricing for each service type
- 🚀 **Performance**: Optimal for both frontend and backend needs

Your AI-powered medical diagnostic platform is now live and ready to help healthcare professionals worldwide! 🏥🚀

---

*This guide ensures your MedAI platform is optimally deployed using Vercel for the frontend and Railway for the backend, providing the best performance and cost efficiency.*