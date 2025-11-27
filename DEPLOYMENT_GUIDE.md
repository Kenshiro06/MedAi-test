# 🚀 Deployment Guide for MedAi Malaria Detection System

## Quick Deploy to Railway (Easiest - 5 minutes)

### Prerequisites
- GitHub account (you already have this ✅)
- Railway account (free - sign up at https://railway.app)

### Step-by-Step Deployment

#### 1. Sign Up for Railway
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

#### 2. Deploy Your Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `Kenshiro06/MedAi-test`
4. Railway will automatically detect and deploy both frontend and backend

#### 3. Set Environment Variables
1. Click on your deployed project
2. Go to "Variables" tab
3. Add these variables:
   ```
   VITE_SUPABASE_URL=https://gchjnljaulusulythgzl.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaGpubGphdWx1c3VseXRoZ3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjYzNDAsImV4cCI6MjA3OTIwMjM0MH0.54-8Jijp5b6GBotYODIlgEzIUz-Q598XJeST29qKDGc
   ```

#### 4. Get Your Public URL
1. Railway will provide a public URL like: `https://your-app.railway.app`
2. Share this URL with anyone to use your app!

---

## Alternative: Deploy to Vercel (Frontend) + Render (Backend)

### Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Login with GitHub
3. Click "New Project"
4. Import `Kenshiro06/MedAi-test`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Deploy Backend to Render

1. Go to https://render.com
2. Login with GitHub
3. Click "New +" → "Web Service"
4. Connect `Kenshiro06/MedAi-test`
5. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python malaria_api_working.py`
6. Click "Create Web Service"

7. Update frontend to use backend URL:
   - Get your Render URL (e.g., `https://your-api.onrender.com`)
   - Update API calls in frontend code

---

## Important Notes

### Free Tier Limitations
- **Railway**: $5/month free credit (enough for small projects)
- **Vercel**: Unlimited for personal projects
- **Render**: Free tier available (may sleep after inactivity)

### Model File
- Your .h5 model (362 MB) is stored in Git LFS
- It will be automatically downloaded during deployment
- First deployment may take 5-10 minutes due to model size

### Database
- Your Supabase database is already hosted and working
- No additional setup needed
- Just ensure environment variables are set correctly

---

## Testing Your Deployment

After deployment:
1. Visit your public URL
2. Try logging in with demo accounts:
   - Email: `technician@medai.com` / IC: `960202022345`
   - Email: `mo@medai.com` / IC: `880202025678`
3. Test AI detection with a malaria sample image
4. Check if reports are being saved to Supabase

---

## Troubleshooting

### Backend Not Starting
- Check if Python dependencies installed correctly
- Verify .h5 model file downloaded (check logs)
- Ensure port is set correctly (Railway auto-assigns)

### Frontend Can't Connect to Backend
- Update API endpoint in frontend code
- Check CORS settings in backend
- Verify environment variables are set

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Review RLS policies in Supabase

---

## Need Help?
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs

Good luck with your deployment! 🎉
