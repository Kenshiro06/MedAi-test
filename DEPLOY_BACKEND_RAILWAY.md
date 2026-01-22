# 🚂 Deploy Backend to Railway - Quick Guide

## 🎯 **Your Setup**
- ✅ **Frontend**: Already deployed on Vercel at `medaifrontend-tan.vercel.app`
- 🔄 **Backend**: Need to deploy on Railway (Python Flask API)

---

## 🚀 **Deploy Backend in 5 Minutes**

### **Step 1: Go to Railway**
1. Visit [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**

### **Step 2: Deploy from GitHub**
1. Select **"Deploy from GitHub repo"**
2. Choose your **MedAI repository**
3. Click **"Deploy Now"**

### **Step 3: Configure Service**
1. **Service Name**: `medai-backend`
2. **Root Directory**: `backend`
3. **Start Command**: `python3 malaria_api_gradcam.py` (Railway will auto-detect this)

### **Step 4: Set Environment Variables**
In Railway dashboard → Variables:
```bash
PYTHON_VERSION=3.10.12
FLASK_ENV=production
```

**Note**: Railway automatically provides the PORT variable, so don't set it manually.

### **Step 5: Deploy & Get URL**
1. Railway will build and deploy automatically
2. Copy your Railway URL (e.g., `https://medai-backend-production.up.railway.app`)

---

## 🔗 **Connect Frontend to Backend**

### **Step 6: Update Vercel Environment**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add/Update:
   ```bash
   VITE_API_URL=https://your-railway-backend-url.up.railway.app
   ```
4. Redeploy your Vercel frontend

---

## ✅ **Test Your Setup**

### **Backend Health Check:**
```bash
curl https://your-railway-backend-url.up.railway.app/health
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

### **Frontend Test:**
1. Visit `https://medaifrontend-tan.vercel.app`
2. Go to Detector page
3. Upload a test image
4. Should see AI analysis results (no more "Failed to fetch" error!)

---

## 🎉 **You're Done!**

Your MedAI platform will be fully functional:
- **Frontend**: `https://medaifrontend-tan.vercel.app`
- **Backend**: `https://your-railway-url.up.railway.app`
- **Database**: Supabase (already configured)

**Total time**: ~5 minutes  
**Cost**: $20/month for Railway backend  
**Performance**: Production-ready! 🚀

---

## 🚨 **If You Get Errors**

### **"python: command not found":**
✅ **Fixed**: Updated to use `python3` instead of `python`

### **"Failed to fetch" still appears:**
1. Check Railway backend is running (visit `/health` endpoint)
2. Verify `VITE_API_URL` in Vercel matches your Railway URL
3. Ensure CORS domains are correct (already updated in your code)

### **Model loading fails:**
1. Check Railway logs for model loading errors
2. Verify Git LFS uploaded the 120MB model file
3. Check Python version is 3.10.12

### **CORS errors:**
1. Your domains are already configured in the code
2. Make sure Railway backend is accessible
3. Check browser network tab for actual error details

### **Build fails:**
1. Check Railway build logs
2. Ensure `requirements.txt` is in backend folder
3. Verify Python version in environment variables

---

**Your AI-powered medical platform is almost live! Just deploy the backend and you're ready to help healthcare professionals worldwide!** 🏥✨