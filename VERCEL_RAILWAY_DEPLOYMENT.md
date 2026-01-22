# 🚀 Vercel + Railway Deployment - MedAI Platform

## 🎯 **Quick Setup Guide**

**Frontend**: Vercel (React) - Lightning fast with global CDN  
**Backend**: Railway (Python Flask) - Perfect for AI models and APIs

---

## 📋 **Step-by-Step Deployment**

### **🐍 Step 1: Deploy Backend on Railway**

1. **Go to [railway.app](https://railway.app)**
2. **New Project** → **Deploy from GitHub repo**
3. **Select your MedAI repository**
4. **Configure:**
   - **Root Directory**: `backend`
   - **Start Command**: `python malaria_api_gradcam.py`

5. **Environment Variables:**
   ```bash
   PYTHON_VERSION=3.10.12
   FLASK_ENV=production
   PORT=${{RAILWAY_PORT}}
   ```

6. **Deploy** and get your Railway URL (e.g., `https://medai-backend-production.up.railway.app`)

---

### **⚛️ Step 2: Deploy Frontend on Vercel**

1. **Go to [vercel.com](https://vercel.com)**
2. **New Project** → **Import Git Repository**
3. **Select your MedAI repository**
4. **Vercel auto-detects Vite React app** ✅

5. **Environment Variables:**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://medai-backend-production.up.railway.app
   ```

6. **Deploy** and get your Vercel URL (e.g., `https://medai.vercel.app`)

---

### **🔗 Step 3: Connect Frontend & Backend**

1. **Update CORS in backend** (already done in your code):
   ```python
   CORS(app, origins=[
       'https://medai.vercel.app',
       'https://medai-*.vercel.app',  # Preview deployments
       'http://localhost:5173'        # Local development
   ])
   ```

2. **Test the connection:**
   - Visit your Vercel URL
   - Try uploading an image in Detector
   - Verify AI predictions work

---

## ✅ **Verification Checklist**

### **Backend (Railway):**
- ✅ API responds at `/health` endpoint
- ✅ Model loads successfully (31.6M parameters)
- ✅ Image upload and prediction work
- ✅ Grad-CAM visualization generates

### **Frontend (Vercel):**
- ✅ App loads and displays correctly
- ✅ Login/authentication works
- ✅ All pages accessible
- ✅ API calls to Railway backend succeed

### **Integration:**
- ✅ Image upload → AI analysis → Results display
- ✅ PDF generation works
- ✅ Multi-user roles function
- ✅ Multilingual switching works

---

## 💰 **Cost Breakdown**

| Service | Plan | Cost | Features |
|---------|------|------|----------|
| **Vercel** | Hobby | **Free** | Unlimited personal projects, 100GB bandwidth |
| **Railway** | Developer | **$20/month** | 8GB RAM, 100GB disk, priority support |
| **Supabase** | Free | **Free** | 500MB database, 50MB file storage |
| **Total** | | **$20/month** | Production-ready setup |

---

## 🎯 **Why This Setup?**

### **Vercel Advantages:**
- ⚡ **Lightning Fast**: Global CDN, edge caching
- 🔄 **Auto Deployments**: Git push → instant deploy
- 🆓 **Free Tier**: Perfect for React apps
- 📊 **Analytics**: Built-in performance monitoring

### **Railway Advantages:**
- 🐍 **Python Optimized**: Perfect for Flask + TensorFlow
- 📦 **Large Files**: Handles 120MB AI model easily
- 🔧 **Simple Setup**: Zero config Python deployment
- 📈 **Scalable**: Auto-scaling based on traffic

### **Combined Benefits:**
- 💰 **Cost Effective**: $20/month total
- 🚀 **High Performance**: Best of both platforms
- 🔒 **Secure**: HTTPS, environment variables
- 📱 **Global**: Fast worldwide access

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

**1. CORS Errors**
```
Access to fetch blocked by CORS policy
```
**Solution**: Verify Vercel URL is in CORS origins list

**2. Environment Variables**
```
VITE_API_URL is undefined
```
**Solution**: Check Vercel environment variables are set

**3. Model Loading**
```
Model file not found
```
**Solution**: Ensure Git LFS uploaded the .h5 file to Railway

**4. API Connection**
```
Failed to fetch from Railway backend
```
**Solution**: Check Railway service is running and URL is correct

---

## 🔧 **Advanced Configuration**

### **Custom Domain (Optional)**
1. **Vercel**: Add custom domain in project settings
2. **Railway**: Add custom domain for API (if needed)

### **Performance Optimization**
1. **Vercel**: Enable edge caching, image optimization
2. **Railway**: Monitor resource usage, scale if needed

### **Security**
1. **Environment Variables**: Never commit secrets to git
2. **CORS**: Only allow your frontend domains
3. **HTTPS**: Both platforms provide SSL automatically

---

## 📞 **Support Resources**

### **Vercel:**
- **Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Discord**: Vercel community
- **GitHub**: Vercel examples

### **Railway:**
- **Docs**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Railway community
- **Templates**: Railway starter templates

---

## 🎉 **You're Live!**

Your MedAI platform is now deployed and accessible worldwide:

- **🌐 Frontend**: `https://medai.vercel.app`
- **🔗 Backend API**: `https://medai-backend-production.up.railway.app`
- **📊 Database**: Supabase (already configured)

**Your AI-powered medical diagnostic platform is ready to help healthcare professionals globally!** 🏥✨

---

*This setup provides enterprise-grade performance and reliability at an affordable cost, perfect for scaling your MedAI platform.*