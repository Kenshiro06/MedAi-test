# 🚀 Vercel + Render Deployment Guide

## Overview
- **Frontend (React)** → Vercel (Free, unlimited for personal projects)
- **Backend (Python API)** → Render (Free tier available)
- **Database** → Supabase (Already hosted ✅)

---

## Part 1: Deploy Backend to Render

### Step 1: Sign Up for Render
1. Go to https://render.com
2. Click "Get Started" → Sign up with GitHub
3. Authorize Render to access your GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your repository: `Kenshiro06/MedAi-test`
3. Configure the service:
   - **Name**: `medai-backend`
   - **Region**: Singapore (closest to Malaysia)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python malaria_api_working.py`

### Step 3: Set Environment Variables (Optional)
- Render will automatically set `PORT` environment variable
- Your backend is already configured to use it

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment (downloading .h5 model takes time)
3. Once deployed, you'll get a URL like: `https://medai-backend.onrender.com`

### Step 5: Test Backend
Visit: `https://medai-backend.onrender.com/health`

You should see:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "message": "Malaria Detection API is running"
}
```

✅ **Backend is ready!** Copy your backend URL for the next step.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update API Endpoint
Before deploying, you need to update your frontend to use the Render backend URL.

**Option A: Environment Variable (Recommended)**
1. Your frontend will use environment variables
2. We'll set this in Vercel dashboard

**Option B: Hardcode (Quick Test)**
Update `src/components/dashboard/views/Detector.jsx`:
```javascript
// Find this line (around line 90):
const response = await fetch('http://localhost:5000/batch-predict', {

// Replace with your Render URL:
const response = await fetch('https://medai-backend.onrender.com/batch-predict', {
```

### Step 2: Sign Up for Vercel
1. Go to https://vercel.com
2. Click "Sign Up" → Continue with GitHub
3. Authorize Vercel to access your GitHub

### Step 3: Import Project
1. Click "Add New..." → "Project"
2. Import `Kenshiro06/MedAi-test`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 4: Add Environment Variables
Click "Environment Variables" and add:

```
VITE_SUPABASE_URL=https://gchjnljaulusulythgzl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaGpubGphdWx1c3VseXRoZ3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjYzNDAsImV4cCI6MjA3OTIwMjM0MH0.54-8Jijp5b6GBotYODIlgEzIUz-Q598XJeST29qKDGc
VITE_API_URL=https://medai-backend.onrender.com
```

**Important:** Replace `https://medai-backend.onrender.com` with your actual Render backend URL!

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a URL like: `https://medai-test.vercel.app`

### Step 6: Test Your App
1. Visit your Vercel URL
2. Login with demo account:
   - Email: `technician@medai.com`
   - IC: `960202022345`
3. Try AI Detector to test backend connection

✅ **Frontend is live!**

---

## Part 3: Update Frontend to Use Environment Variable

To make your app use the `VITE_API_URL` environment variable:

**Update `src/components/dashboard/views/Detector.jsx`:**

Find line ~90:
```javascript
const response = await fetch('http://localhost:5000/batch-predict', {
```

Replace with:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const response = await fetch(`${apiUrl}/batch-predict`, {
```

This way:
- **Production**: Uses Render backend URL from environment variable
- **Development**: Falls back to localhost:5000

After making this change:
1. Commit and push to GitHub
2. Vercel will automatically redeploy (takes 1-2 minutes)

---

## Important Notes

### Free Tier Limitations

**Render Free Tier:**
- ✅ Unlimited bandwidth
- ✅ 512 MB RAM (enough for your model)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after sleep takes 30-60 seconds to wake up
- 💡 **Solution**: Use a service like UptimeRobot to ping your backend every 10 minutes

**Vercel Free Tier:**
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Instant deployments
- ✅ Perfect for frontend

### CORS Configuration
Your backend already has CORS enabled:
```python
from flask_cors import CORS
CORS(app)  # Allows all origins
```

If you want to restrict to only your Vercel domain:
```python
CORS(app, origins=['https://medai-test.vercel.app'])
```

### Model File (.h5)
- ✅ Already in Git LFS
- ✅ Render will download it automatically during build
- ⏱️ First deployment takes 5-10 minutes

---

## Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- Check Render logs: Dashboard → Your Service → Logs
- Verify `requirements.txt` is correct
- Ensure Python version is 3.9+

**Problem**: Model not loading
- Check if .h5 file downloaded (look for "Model loaded successfully!" in logs)
- Verify Git LFS is working

**Problem**: Backend sleeping
- Use UptimeRobot (free) to ping `/health` endpoint every 10 minutes
- Or upgrade to Render paid plan ($7/month) for always-on

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `VITE_API_URL` is set correctly in Vercel
- Check browser console for CORS errors
- Test backend health endpoint directly

**Problem**: Environment variables not working
- Redeploy in Vercel after adding variables
- Variables must start with `VITE_` to be accessible in frontend

**Problem**: Build fails
- Check Vercel build logs
- Verify `package.json` has correct build script
- Ensure all dependencies are in `package.json`

---

## Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add your domain (e.g., `medai.yourdomain.com`)
3. Update DNS records as instructed
4. Vercel handles SSL automatically

### For Render (Backend):
1. Go to Service Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records
4. Render handles SSL automatically

---

## Monitoring & Maintenance

### Keep Backend Awake (Free Solution)
1. Sign up at https://uptimerobot.com (free)
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://medai-backend.onrender.com/health`
   - Interval: 10 minutes
3. This prevents backend from sleeping

### Check Logs
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Deployments → View Function Logs

### Update Deployment
Just push to GitHub:
```bash
git add .
git commit -m "Update"
git push origin main
```

Both Vercel and Render will auto-deploy! 🚀

---

## Cost Summary

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| Vercel (Frontend) | ✅ Unlimited | $20/month (Pro) |
| Render (Backend) | ✅ 750 hours/month | $7/month (always-on) |
| Supabase (Database) | ✅ 500 MB | $25/month (Pro) |
| **Total** | **FREE** | $32/month (optional) |

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Get backend URL
3. ✅ Deploy frontend to Vercel
4. ✅ Set environment variables
5. ✅ Test the app
6. 🎉 Share your live URL!

Your app will be live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`

Good luck! 🚀
