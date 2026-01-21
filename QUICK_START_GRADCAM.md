# 🚀 Quick Start: Test Grad-CAM Locally

## ⚡ 3-Step Quick Test

### Step 1: Start API (Terminal 1)
```bash
cd backend
python malaria_api_gradcam.py
```

Wait for: `✅ Server ready to accept requests!`

---

### Step 2: Test API (Terminal 2)
```bash
python backend/test_gradcam.py
```

Expected: `🎉 Grad-CAM API is working correctly!`

---

### Step 3: Test Frontend
```bash
npm run dev
```

Then:
1. Go to AI Detector
2. Upload malaria images
3. **Toggle Grad-CAM ON** ✅
4. Start Analysis
5. **Look for side-by-side images** (Original + Heatmap)

---

## 🎨 What You Should See

### In Results Page:

```
┌─────────────────────────────────────┐
│  Field 1                            │
│  ┌──────────┬──────────┐           │
│  │ Original │ Grad-CAM │           │
│  │   ○○○    │  🔵🔵🔵   │           │
│  │   ○●○    │  🔵🔴🔵   │  ← Red = Parasite!
│  │   ○○○    │  🔵🔵🔵   │           │
│  └──────────┴──────────┘           │
└─────────────────────────────────────┘
```

---

## ✅ Success Indicators

- ✅ API starts without errors
- ✅ Test script shows "Grad-CAM generated"
- ✅ Frontend shows heatmaps next to original images
- ✅ Red/yellow areas highlight parasites
- ✅ Blue/green areas show healthy cells

---

## ❌ Common Issues

### "Module cv2 not found"
```bash
pip install opencv-python==4.8.1.78
```

### "Model not found"
```bash
# Check if model exists
ls backend/malaria_final.h5
```

### "No Grad-CAM in results"
- Make sure toggle is **ON** before analysis
- Check API logs for errors

---

## 🚀 Deploy to Render (After Local Test Passes)

```bash
git add .
git commit -m "Deploy Grad-CAM API"
git push
```

Then check Render dashboard for deployment status.

---

## 📊 Toggle Comparison

| Feature | Grad-CAM ON | Grad-CAM OFF |
|---------|-------------|--------------|
| Speed | ~2.5s/image | ~1.5s/image |
| Heatmaps | ✅ Yes | ❌ No |
| Memory | ~800MB | ~500MB |
| Use Case | Detailed analysis | Quick screening |

---

## 🆘 Need Help?

1. Check `GRADCAM_TESTING_GUIDE.md` for detailed troubleshooting
2. Check API logs: `python malaria_api_gradcam.py`
3. Check browser console for frontend errors

---

**Ready?** Start with Step 1! 🚀
