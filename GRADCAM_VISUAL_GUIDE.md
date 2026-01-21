# 🎨 Grad-CAM Visual Guide

## What is Grad-CAM?

**Grad-CAM** (Gradient-weighted Class Activation Mapping) shows WHERE the AI is looking when making predictions.

---

## Visual Example

### Before Grad-CAM (Old System)
```
Input Image → AI Model → Result: "Positive - Parasitized (95%)"
     ❓                        ❓
   "Why?"                  "Where?"
```

### After Grad-CAM (New System)
```
Input Image → AI Model → Result + Heatmap
                ↓
         Shows exactly where
         AI detected parasites!
```

---

## Heatmap Color Guide

```
🔴 RED/YELLOW    = High confidence parasite detection
🟡 YELLOW/GREEN  = Medium confidence
🟢 GREEN/CYAN    = Low confidence
🔵 BLUE          = Healthy cells (no parasites)
```

---

## Real-World Example

```
┌─────────────────────────────────────────────┐
│  ORIGINAL IMAGE    │    GRAD-CAM HEATMAP    │
├─────────────────────────────────────────────┤
│                    │                        │
│    ○  ○  ○        │    🔵 🔵 🔵           │
│    ○  ●  ○        │    🔵 🔴 🔵  ← Parasite!
│    ○  ○  ○        │    🔵 🔵 🔵           │
│                    │                        │
└─────────────────────────────────────────────┘
```

---

## Medical Value

✅ **Verify AI is correct** - See if red areas match actual parasites  
✅ **Catch false positives** - Red on healthy cells = wrong  
✅ **Training tool** - Teach staff what AI looks for  
✅ **Quality assurance** - Document AI reasoning  
✅ **Research** - Understand model behavior  

---

## Toggle Options

### Grad-CAM ON (Slow Mode)
- ⏱️ ~2.5s per image
- 🎨 Shows heatmaps
- 📊 Best for: Verification, training, documentation

### Grad-CAM OFF (Fast Mode)
- ⚡ ~1.5s per image
- 🚫 No heatmaps
- 📊 Best for: Quick screening, batch processing

---

**Ready to test?** See `QUICK_START_GRADCAM.md`
