"""
Malaria Detection API - Based on YOUR WORKING Flask App
Adapted for React frontend integration
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import numpy as np
import os
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for React

# Configuration
MODEL_PATH = "malaria_finetune_stage2.h5"
IMAGE_SIZE = (256, 256)
UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model at startup
print("=" * 60)
print("🔬 Malaria Detection API Server")
print("=" * 60)
print(f"Loading model from {MODEL_PATH}...")

try:
    model = load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("Please ensure 'malaria_finetune_stage2.h5' is in the backend folder")
    exit(1)

def preprocess_image(path):
    """
    YOUR WORKING preprocessing method
    """
    img = load_img(path, target_size=IMAGE_SIZE)
    arr = img_to_array(img).astype("float32")
    arr /= 255.0
    return np.expand_dims(arr, axis=0)

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "message": "Malaria Detection API is running"
    })

@app.route("/predict", methods=["POST"])
def predict():
    """
    Single image prediction
    Expects: multipart/form-data with 'image' field
    """
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files["image"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        # Save uploaded file temporarily
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Preprocess using YOUR working method
            x = preprocess_image(filepath)
            
            # Predict using YOUR working method
            preds = model.predict(x)
            raw = float(preds[0][0])
            
            # YOUR working logic
            TH = 0.5
            predicted = "Parasitized" if raw > TH else "Uninfected"
            
            if predicted == "Parasitized":
                result = "Positive - Parasitized"
                conf = raw * 100
            else:
                result = "Negative - Uninfected"
                conf = (1 - raw) * 100
            
            response = {
                "result": result,
                "confidence": round(conf, 2),
                "raw_score": round(raw, 6),
                "interpretation": {
                    "parasitized": predicted == "Parasitized",
                    "class": predicted
                }
            }
            
            print(f"✅ Prediction: {result} (Confidence: {response['confidence']}%)")
            
            return jsonify(response)
            
        finally:
            # Clean up temp file
            try:
                os.remove(filepath)
            except:
                pass
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    """
    Multiple images prediction (OPTIMIZED for speed)
    Expects: multipart/form-data with multiple 'images' fields
    """
    try:
        if "images" not in request.files:
            return jsonify({"error": "No images provided"}), 400
        
        files = request.files.getlist("images")
        print(f"📦 Processing batch of {len(files)} images...")
        
        # Save all files first
        filepaths = []
        for idx, file in enumerate(files):
            filename = f"{uuid.uuid4().hex}.jpg"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            filepaths.append((idx, file.filename, filepath))
        
        # Preprocess all images into a batch
        batch_images = []
        valid_indices = []
        for idx, original_name, filepath in filepaths:
            try:
                x = preprocess_image(filepath)
                batch_images.append(x[0])  # Remove batch dimension
                valid_indices.append((idx, original_name, filepath))
            except Exception as e:
                print(f"⚠️ Failed to preprocess {original_name}: {e}")
        
        # Predict entire batch at once (MUCH FASTER!)
        if len(batch_images) > 0:
            batch_array = np.array(batch_images)
            print(f"🔬 Analyzing batch of {len(batch_array)} images...")
            preds = model.predict(batch_array, verbose=0)
            
            results = []
            TH = 0.5
            
            for i, (idx, original_name, filepath) in enumerate(valid_indices):
                try:
                    raw = float(preds[i][0])
                    predicted = "Parasitized" if raw > TH else "Uninfected"
                    
                    if predicted == "Parasitized":
                        result = "Positive - Parasitized"
                        conf = raw * 100
                    else:
                        result = "Negative - Uninfected"
                        conf = (1 - raw) * 100
                    
                    results.append({
                        "index": idx,
                        "filename": original_name,
                        "result": result,
                        "confidence": round(conf, 2),
                        "raw_score": round(raw, 6)
                    })
                except Exception as e:
                    results.append({
                        "index": idx,
                        "filename": original_name,
                        "error": str(e)
                    })
            
            # Clean up all temp files
            for _, _, filepath in filepaths:
                try:
                    os.remove(filepath)
                except:
                    pass
        else:
            results = []
            # Still clean up files
            for _, _, filepath in filepaths:
                try:
                    os.remove(filepath)
                except:
                    pass
        
        # Calculate aggregate statistics
        successful = [r for r in results if "error" not in r]
        
        if successful:
            parasitized_count = sum(1 for r in successful if "Parasitized" in r["result"])
            avg_confidence = sum(r["confidence"] for r in successful) / len(successful)
            
            aggregate = {
                "total_images": len(files),
                "successful": len(successful),
                "failed": len(files) - len(successful),
                "parasitized_count": parasitized_count,
                "uninfected_count": len(successful) - parasitized_count,
                "average_confidence": round(avg_confidence, 2),
                "overall_result": "Positive - Parasitized" if parasitized_count > len(successful) / 2 else "Negative - Uninfected"
            }
        else:
            aggregate = {
                "total_images": len(files),
                "successful": 0,
                "failed": len(files)
            }
        
        return jsonify({
            "results": results,
            "aggregate": aggregate
        })
        
    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("\n🚀 Starting Flask server on http://localhost:5000")
    print("📡 API Endpoints:")
    print("   - GET  /health          - Health check")
    print("   - POST /predict         - Single image prediction")
    print("   - POST /batch-predict   - Multiple images prediction")
    print("\n✅ Server ready to accept requests!")
    print("=" * 60)
    
    # Run server (use debug=False for production)
    app.run(host="0.0.0.0", port=5000, debug=False)
