# Grad-CAM Testing & Deployment Guide

## 🎯 Current Status

✅ **Completed:**
- Grad-CAM API implementation (`malaria_api_gradcam.py`)
- Model migrated to `malaria_final.h5` (VGG19, 224x224)
- OpenCV dependencies added
- Frontend toggle for Grad-CAM visualization
- Side-by-side image display (Original + Heatmap)
- Test script ready

❌ **Issue:**
- Render backend is down (502 Bad Gateway)
- Need to test locally first before redeploying

---

## 📋 Step 1: Local Testing (DO THIS FIRST!)

### 1.1 Install Dependencies

```bash
cd backend
pip install opencv-python==4.8.1.78
```

### 1.2 Start the Grad-CAM API

```bash
# Make sure you're in the backend folder
python malaria_api_gradcam.py
```

**Expected Output:**
```
============================================================
🔬 Malaria Detection API Server with Grad-CAM
============================================================
Loading model from malaria_final.h5...
✅ Model loaded successfully!
Model input shape: (None, 224, 224, 3)
Model output shape: (None, 1)
Model architecture: VGG19-based

🚀 Starting Flask server with Grad-CAM support
📡 API Endpoints:
   - GET  /health              - Health check
   - POST /predict             - Single image prediction with Grad-CAM
   - POST /batch-predict       - Multiple images WITH Grad-CAM (slower)
   - POST /batch-predict-fast  - Multiple images WITHOUT Grad-CAM (faster)

✅ Server ready to accept requests!
============================================================
 * Running on http://0.0.0.0:5000
```

### 1.3 Run Test Script (New Terminal)

```bash
# From project root
python backend/test_gradcam.py
```

**Expected Output:**
```
🧪 Testing Grad-CAM API...
✅ API is running
   Model: malaria_final.h5
   Type: VGG19 with Grad-CAM
🔬 Testing prediction with backend/test.jpg...
⏱️ Single prediction took 2.34 seconds
✅ Prediction: Positive - Parasitized
   Confidence: 95.2%
✅ Grad-CAM generated (size: 45678 bytes)

🎉 Grad-CAM API is working correctly!
```

### 1.4 Test from Frontend

1. **Start Frontend:**
```bash
npm run dev
```

2. **Navigate to AI Detector:**
   - Go to http://localhost:5173
   - Login and go to "AI Detector" page

3. **Test with Grad-CAM:**
   - Select disease type (Malaria)
   - Fill patient details
   - Upload malaria microscope images
   - **✅ Toggle "Enable AI Visualization (Grad-CAM)" ON**
   - Click "Start Analysis"
   - Wait for results (will take ~3x longer with Grad-CAM)
   - **Verify:** You should see side-by-side images (Original + Heatmap)

4. **Test Fast Mode:**
   - Upload new images
   - **❌ Toggle "Enable AI Visualization (Grad-CAM)" OFF**
   - Click "Start Analysis"
   - Wait for results (should be faster)
   - **Verify:** No heatmaps, just original images

---

## 🚀 Step 2: Deploy to Render (After Local Testing Passes)

### 2.1 Verify Files

Make sure these files are ready:
```
backend/
├── malaria_final.h5              ✅ New model
├── malaria_api_gradcam.py        ✅ Grad-CAM API
├── requirements.txt              ✅ With opencv-python
├── apt-packages.txt              ✅ System dependencies
├── render.yaml                   ✅ Updated to use gradcam API
```

### 2.2 Check render.yaml

File should contain:
```yaml
services:
  - type: web
    name: medai-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python malaria_api_gradcam.py  # ← Using Grad-CAM API
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: PORT
        generateValue: true
```

### 2.3 Check apt-packages.txt

File should contain:
```
libgl1-mesa-glx
libglib2.0-0
```

These are required for OpenCV to work on Render.

### 2.4 Commit and Push

```bash
git add backend/render.yaml
git add backend/malaria_api_gradcam.py
git add backend/malaria_final.h5
git add backend/requirements.txt
git add backend/apt-packages.txt
git commit -m "Deploy Grad-CAM API with VGG19 model"
git push
```

### 2.5 Monitor Render Deployment

1. Go to Render Dashboard
2. Watch the deployment logs
3. Look for:
   - ✅ `pip install opencv-python` succeeds
   - ✅ `Model loaded successfully!`
   - ✅ `Server ready to accept requests!`

### 2.6 Test Production API

```bash
# Health check
curl https://medai-backend-ci7d.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "malaria_final.h5",
  "model_type": "VGG19 with Grad-CAM",
  "message": "Malaria Detection API with Grad-CAM is running"
}
```

---

## 🐛 Troubleshooting

### Issue 1: "Module 'cv2' not found"

**Solution:**
```bash
pip install opencv-python==4.8.1.78
```

### Issue 2: "Error loading model"

**Cause:** Model file not found or corrupted

**Solution:**
```bash
# Check if model exists
ls -la backend/malaria_final.h5

# If missing, download from your training environment
# Model should be ~80-100MB
```

### Issue 3: "Grad-CAM generation failed"

**Cause:** Layer name mismatch or model architecture issue

**Solution:**
- API will still return predictions without Grad-CAM
- Check logs for specific error
- Verify model is VGG19-based

### Issue 4: Render deployment fails with OpenCV

**Cause:** Missing system dependencies

**Solution:**
1. Ensure `apt-packages.txt` exists in backend folder
2. Contains:
   ```
   libgl1-mesa-glx
   libglib2.0-0
   ```
3. Render will automatically install these during build

### Issue 5: Render out of memory

**Cause:** VGG19 model is larger (~800MB RAM)

**Solution:**
- Upgrade Render plan (free tier has 512MB limit)
- Or use old API without Grad-CAM:
  ```yaml
  startCommand: python malaria_api_working.py
  ```

### Issue 6: Frontend shows "No Grad-CAM"

**Cause:** Grad-CAM toggle was OFF during analysis

**Solution:**
- Re-run analysis with toggle ON
- Or backend API doesn't support Grad-CAM

---

## 📊 Performance Comparison

### Fast Mode (Grad-CAM OFF)
- **Speed:** ~1.5s per image
- **Memory:** ~500MB
- **Output:** Predictions only
- **Use Case:** Quick screening, batch processing

### Grad-CAM Mode (Grad-CAM ON)
- **Speed:** ~2.5s per image
- **Memory:** ~800MB
- **Output:** Predictions + Heatmaps
- **Use Case:** Detailed analysis, verification, training

---

## 🎨 Understanding Grad-CAM Heatmaps

### Red/Yellow Regions (Hot)
- **Meaning:** AI detected parasites here
- **Interpretation:** High activation, parasite presence
- **Action:** Medical staff should verify these areas

### Blue/Green Regions (Cool)
- **Meaning:** Healthy cells, no parasites
- **Interpretation:** Low activation, normal cells
- **Action:** Confirms negative areas

### Example Interpretation:

```
Original Image          Grad-CAM Heatmap
┌─────────────┐        ┌─────────────┐
│   ○ ○ ○     │   →    │   🔵🔵🔵     │  Healthy cells
│   ○ ● ○     │        │   🔵🔴🔵     │  Parasite detected!
│   ○ ○ ○     │        │   🔵🔵🔵     │  Healthy cells
└─────────────┘        └─────────────┘
```

---

## 🔄 Rollback Plan (If Needed)

If Grad-CAM causes issues in production:

### Option 1: Use Old API (No Grad-CAM)

Update `render.yaml`:
```yaml
startCommand: python malaria_api_working.py
```

Commit and push:
```bash
git add backend/render.yaml
git commit -m "Rollback to old API without Grad-CAM"
git push
```

### Option 2: Keep Grad-CAM but Use Old Model

Update `malaria_api_gradcam.py`:
```python
MODEL_PATH = "malaria_finetune_stage2.h5"  # Old model
IMAGE_SIZE = (256, 256)  # Old size
```

---

## ✅ Success Checklist

Before marking as complete, verify:

- [ ] Local API starts without errors
- [ ] Test script passes all checks
- [ ] Frontend displays Grad-CAM heatmaps
- [ ] Fast mode works (no heatmaps)
- [ ] Slow mode works (with heatmaps)
- [ ] Heatmaps are meaningful (red on parasites)
- [ ] Render deployment succeeds
- [ ] Production API health check passes
- [ ] Production frontend works with Grad-CAM

---

## 📞 Support

If you encounter issues:

1. **Check API logs:**
   ```bash
   python malaria_api_gradcam.py
   ```

2. **Test with curl:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Verify model:**
   ```bash
   ls -la backend/malaria_final.h5
   ```

4. **Check dependencies:**
   ```bash
   pip list | grep opencv
   pip list | grep tensorflow
   ```

---

## 🎯 Next Steps After Deployment

1. **Monitor Performance:**
   - Track API response times
   - Monitor memory usage
   - Check error rates

2. **Collect Feedback:**
   - Ask medical staff if heatmaps are helpful
   - Verify AI is focusing on correct areas
   - Adjust visualization if needed

3. **Optimize:**
   - Consider caching Grad-CAM results
   - Implement async processing for large batches
   - Add progress indicators for long analyses

4. **Documentation:**
   - Train staff on interpreting Grad-CAM
   - Create visual guides
   - Document common patterns

---

## 📚 References

- **Grad-CAM Paper:** https://arxiv.org/abs/1610.02391
- **VGG19 Architecture:** https://arxiv.org/abs/1409.1556
- **OpenCV Documentation:** https://docs.opencv.org/
- **Render Deployment:** https://render.com/docs/deploy-flask

---

**Last Updated:** December 9, 2025
**Status:** Ready for local testing → Production deployment
