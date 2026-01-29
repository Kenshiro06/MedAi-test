# Deployment Verification Guide

## Updated Configuration

### Frontend (Vercel)
- **Production**: https://medai-usim.vercel.app
- **Git Branch**: https://medaifrontend-git-main-musabsahrim-3331s-projects.vercel.app
- **Preview**: https://medaifrontend-f5hmqpqcq-musabsahrim-3331s-projects.vercel.app

### Backend (Railway)
- **URL**: https://medai-backend-production-7450.up.railway.app

## Changes Applied ✅

1. **Backend CORS Updated** - Now accepts requests from:
   - medai-usim.vercel.app (production)
   - medaifrontend-git-main-musabsahrim-3331s-projects.vercel.app
   - medaifrontend-f5hmqpqcq-musabsahrim-3331s-projects.vercel.app
   - All other Vercel preview domains (*.vercel.app)

2. **Frontend Environment Updated**
   - `.env` file updated with new Railway URL
   - `.env.example` updated for reference

3. **Documentation Updated**
   - DOMAIN_UPDATE_SUMMARY.md reflects new URLs

## Verification Steps

### 1. Wait for Railway Deployment
Railway will auto-deploy in 2-3 minutes. Monitor at:
- Railway Dashboard → Your Project → Deployments

### 2. Test Backend Health
```bash
curl https://medai-backend-production-7450.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "malaria_finetune_stage2_tf215.h5"
}
```

### 3. Test Frontend Connection

Visit each domain and test malaria detection:

**Production:**
1. Go to: https://medai-usim.vercel.app
2. Login with demo account
3. Navigate to Detector page
4. Upload a malaria test image
5. Verify:
   - Image uploads successfully
   - Prediction appears
   - Grad-CAM visualization displays
   - No CORS errors in browser console (F12)

**Git Branch:**
1. Go to: https://medaifrontend-git-main-musabsahrim-3331s-projects.vercel.app
2. Repeat same tests

**Preview:**
1. Go to: https://medaifrontend-f5hmqpqcq-musabsahrim-3331s-projects.vercel.app
2. Repeat same tests

### 4. Check Browser Console
Open Developer Tools (F12) → Console tab:
- ✅ Should see: Successful API calls to Railway backend
- ❌ Should NOT see: CORS errors or network failures

### 5. Test All Features
- [ ] Login/Logout
- [ ] Image upload
- [ ] Malaria detection
- [ ] Grad-CAM visualization
- [ ] PDF report generation
- [ ] Analysis history
- [ ] User management (if admin)

## Troubleshooting

### If CORS errors appear:
1. Check Railway deployment completed successfully
2. Verify backend logs show CORS configuration loaded
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### If API calls fail:
1. Verify Railway backend is running: https://medai-backend-production-7450.up.railway.app/health
2. Check `.env` file has correct VITE_API_URL
3. Rebuild and redeploy Vercel frontend if needed

### If images don't upload:
1. Check browser console for specific error
2. Verify file size is under limit
3. Test with different image formats (PNG, JPG)

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://gchjnljaulusulythgzl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://medai-backend-production-7450.up.railway.app
```

### Vercel Environment Variables
Make sure these are set in Vercel dashboard:
1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify VITE_API_URL is set to: `https://medai-backend-production-7450.up.railway.app`
3. If not set, add it and redeploy

## Success Criteria

✅ All three Vercel domains can access Railway backend
✅ No CORS errors in browser console
✅ Malaria detection works end-to-end
✅ Grad-CAM visualizations generate correctly
✅ PDF reports download successfully
✅ All user roles function properly

## Next Steps After Verification

1. Test with real users across different browsers
2. Monitor Railway logs for any errors
3. Check Vercel analytics for traffic patterns
4. Set up monitoring/alerting if needed
