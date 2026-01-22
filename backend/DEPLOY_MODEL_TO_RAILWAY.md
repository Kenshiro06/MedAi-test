# 🚀 Deploy Model File to Railway

## ✅ Your API is WORKING on Railway!

The only issue is the 120MB model file (`malaria_finetune_stage2_tf215.h5`) wasn't uploaded because GitHub has a 100MB limit.

## 🎯 **Solution: Upload Model via Railway CLI**

### **Option 1: Railway Volume (Recommended)**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to your project:**
   ```bash
   cd backend
   railway link
   ```

4. **Upload the model file:**
   ```bash
   railway run bash
   # Then in the Railway shell:
   # Upload your model file using scp or wget
   ```

### **Option 2: Use Cloud Storage (Easier)**

Upload your model to Google Drive, Dropbox, or AWS S3, then download it in your Dockerfile:

**Update Dockerfile:**
```dockerfile
# Add after COPY . .
RUN apt-get update && apt-get install -y wget
RUN wget -O malaria_finetune_stage2_tf215.h5 "YOUR_DOWNLOAD_LINK"
```

### **Option 3: Git LFS (Best for Version Control)**

1. **Install Git LFS:**
   ```bash
   git lfs install
   ```

2. **Track .h5 files:**
   ```bash
   git lfs track "*.h5"
   git add .gitattributes
   ```

3. **Add and push the model:**
   ```bash
   git add backend/malaria_finetune_stage2_tf215.h5
   git commit -m "Add model file with Git LFS"
   git push
   ```

## 🎯 **Temporary Solution: Test Without Model**

Your API is running! You can test the `/health` endpoint right now:

```bash
curl https://your-railway-url.up.railway.app/health
```

Once you upload the model file, your API will be fully functional!

## 📝 **Your Railway URL**

Check your Railway dashboard for your public URL, then update your Vercel frontend's `VITE_API_URL` environment variable.
