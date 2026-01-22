# 🚂 Railway Deployment Guide - MedAI Platform

## 📋 **Overview**

This guide will help you deploy both the **frontend** (React) and **backend** (Python Flask) of your MedAI platform on Railway.

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │───▶│   (Flask API)   │───▶│   (Supabase)    │
│   Railway       │    │   Railway       │    │   Cloud         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 **Step 1: Deploy Backend (Python API)**

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

## 🎨 **Step 2: Deploy Frontend (React)**

### **2.1 Create Frontend Service**
1. In the same Railway project, click **"+ New Service"**
2. Select **"GitHub Repo"**
3. Choose the **same repository**
4. Name it: `medai-frontend`

### **2.2 Configure Frontend Service**
1. **Root Directory**: Leave as root (default)
2. **Build Command**: `npm run build`
3. **Start Command**: `npm run preview`

### **2.3 Frontend Environment Variables**
Add these in Railway dashboard:

```bash
# Node.js Configuration
NODE_ENV=production

# Supabase Configuration (get from your Supabase dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL (will be your Railway backend URL)
VITE_API_URL=https://medai-backend-production.up.railway.app
```

### **2.4 Update package.json**
Make sure your `package.json` has the preview script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port $PORT"
  }
}
```

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

### **3.2 Frontend Railway Config** (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm run preview",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "VITE_SUPABASE_URL": "$VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY": "$VITE_SUPABASE_ANON_KEY",
        "VITE_API_URL": "$VITE_API_URL"
      }
    }
  }
}
```

---

## 🔧 **Step 4: Update API URL in Frontend**

After backend is deployed, update your frontend to use the Railway backend URL:

### **4.1 Get Backend URL**
1. Go to your backend service in Railway
2. Copy the **public URL** (e.g., `https://medai-backend-production.up.railway.app`)

### **4.2 Update Frontend Environment**
Set the `VITE_API_URL` environment variable to your backend URL.

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

### **6.1 Backend Health Check**
Test your backend API:
```bash
curl https://your-backend-url.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "malaria_finetune_stage2_tf215.h5",
  "message": "Malaria Detection API with Grad-CAM is running"
}
```

### **6.2 Frontend Access**
1. Visit your frontend URL
2. Test login functionality
3. Upload a test image in Detector
4. Verify AI predictions work

---

## 🔒 **Step 7: Security & Environment Setup**

### **7.1 Environment Variables Checklist**

**Backend:**
- ✅ `PYTHON_VERSION=3.10.12`
- ✅ `FLASK_ENV=production`
- ✅ `PORT=${{RAILWAY_PORT}}`

**Frontend:**
- ✅ `NODE_ENV=production`
- ✅ `VITE_SUPABASE_URL=your-supabase-url`
- ✅ `VITE_SUPABASE_ANON_KEY=your-anon-key`
- ✅ `VITE_API_URL=your-backend-railway-url`

### **7.2 CORS Configuration**
Your Flask API should allow requests from your frontend domain:

```python
# In malaria_api_gradcam.py
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://your-frontend-url.up.railway.app'])
```

---

## 📊 **Step 8: Monitoring & Logs**

### **8.1 Railway Dashboard**
- **Deployments**: Track build and deployment status
- **Metrics**: Monitor CPU, memory, and network usage
- **Logs**: View real-time application logs
- **Environment**: Manage environment variables

### **8.2 Health Monitoring**
Set up monitoring for:
- API response times
- Model loading status
- Error rates
- Resource usage

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

## 💰 **Railway Pricing**

### **Free Tier Limits:**
- **$5 credit per month**
- **500 hours of usage**
- **1GB RAM per service**
- **1GB disk space**

### **Recommended Plan:**
- **Developer Plan**: $20/month
- **8GB RAM per service**
- **100GB disk space**
- **Priority support**

---

## 🎯 **Deployment Checklist**

### **Pre-deployment:**
- ✅ Code pushed to GitHub
- ✅ Environment variables documented
- ✅ Model file uploaded via Git LFS
- ✅ Railway configurations created

### **Backend Deployment:**
- ✅ Railway project created
- ✅ Backend service configured
- ✅ Environment variables set
- ✅ Health check passes

### **Frontend Deployment:**
- ✅ Frontend service created
- ✅ Build configuration set
- ✅ API URL updated
- ✅ Application accessible

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
- **Frontend**: `https://medai-frontend-production.up.railway.app`
- **Backend API**: `https://medai-backend-production.up.railway.app`

Your AI-powered medical diagnostic platform is now live and ready to help healthcare professionals worldwide! 🏥🚀

---

*This guide ensures your MedAI platform is properly deployed on Railway with optimal performance and security.*