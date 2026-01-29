"""
Malaria Detection API with Grad-CAM Visualization
Updated to use malaria_final.h5 model with VGG19 architecture
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.vgg19 import preprocess_input
import tensorflow as tf
import numpy as np
import os
import uuid
import cv2
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app, origins=[
    'https://medai-usim.vercel.app',                                 # Production domain
    'https://medaifrontend-git-main-musabsahrim-3331s-projects.vercel.app',  # Git branch domain
    'https://medaifrontend-f5hmqpqcq-musabsahrim-3331s-projects.vercel.app', # Preview domain
    'https://medaifrontend-tan.vercel.app',                          # Old production domain (backup)
    'https://medaifrontend-*.vercel.app',                            # Any other Vercel previews
    'http://localhost:5173',                                         # Local Vite dev server
    'http://localhost:3000',                                         # Alternative local port
    'http://127.0.0.1:5173',                                        # Alternative localhost
    'http://127.0.0.1:3000'                                         # Alternative localhost
])  # Enable CORS for React frontend

# Configuration
MODEL_PATH = "malaria_finetune_stage2_tf215.h5"  # Use converted model (TF 2.15 compatible)
IMAGE_SIZE = (256, 256)
UPLOAD_FOLDER = "temp_uploads"
GRADCAM_FOLDER = "temp_gradcam"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GRADCAM_FOLDER, exist_ok=True)

# Load model at startup
print("=" * 60)
print("🔬 Malaria Detection API Server with Grad-CAM")
print("=" * 60)
print(f"Loading model from {MODEL_PATH}...")

try:
    model = load_model(MODEL_PATH, compile=False)
    print("✅ Model loaded successfully WITH YOUR TRAINED WEIGHTS!")
    print(f"   Model input shape: {model.input_shape}")
    print(f"   Model output shape: {model.output_shape}")
    print(f"   Model architecture: VGG16-based")
    print(f"   Total parameters: {model.count_params():,}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print(f"Please ensure '{MODEL_PATH}' exists and is compatible with TensorFlow {tf.__version__}")
    exit(1)

def preprocess_image(path):
    """
    Simple preprocessing for malaria_finetune_stage2.h5
    """
    img = load_img(path, target_size=IMAGE_SIZE)
    arr = img_to_array(img).astype("float32")
    arr /= 255.0  # Simple normalization
    return np.expand_dims(arr, axis=0)

def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None, invert_gradients=False):
    """
    Generates Grad-CAM heatmap.
    Args:
        invert_gradients (bool): If True, visualizes the 'Negative' class (evidence of absence)
    """
    # 1. Find the target layer and its containing model
    target_layer = None
    containing_model = None
    
    try:
        target_layer = model.get_layer(last_conv_layer_name)
        containing_model = model
    except ValueError:
        for layer in model.layers:
            if isinstance(layer, tf.keras.Model):
                try:
                    target_layer = layer.get_layer(last_conv_layer_name)
                    containing_model = layer
                    break
                except ValueError:
                    continue
    
    if target_layer is None:
        raise ValueError(f"Layer {last_conv_layer_name} not found in model.")
    
    # 2. Get activations and predictions
    with tf.GradientTape() as tape:
        if containing_model == model:
            grad_model = tf.keras.models.Model([model.inputs], [target_layer.output, model.output])
            conv_out, preds = grad_model(img_array)
        else:
            part1_model = tf.keras.models.Model([containing_model.inputs], [target_layer.output, containing_model.output])
            conv_out, part1_out = part1_model(img_array)
            x = part1_out
            start_forwarding = False
            for layer in model.layers:
                if layer == containing_model:
                    start_forwarding = True
                    continue
                if start_forwarding:
                    x = layer(x)
            preds = x
        
        if model.output_shape[-1] == 1:
            pred_index = 0
        elif pred_index is None:
            pred_index = tf.argmax(preds[0])
        
        class_channel = preds[:, pred_index]
        
        # 3. Get Gradients
        grads = tape.gradient(class_channel, conv_out)
    
    # 4. Handle different modes
    if invert_gradients:
        # NEGATIVE MODE: Show evidence of absence (healthy cell)
        conv_out_np = conv_out[0].numpy()
        activation_magnitude = np.mean(np.abs(conv_out_np), axis=-1)
        max_activation = activation_magnitude.max()
        inverse_activation = max_activation - activation_magnitude
        
        if inverse_activation.max() > 0:
            heatmap = inverse_activation / inverse_activation.max()
        else:
            heatmap = inverse_activation
        return heatmap
    else:
        # POSITIVE MODE: Show evidence of presence (parasite)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_out = conv_out[0]
        heatmap = conv_out @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        
        denom = tf.math.reduce_max(heatmap)
        heatmap = tf.maximum(heatmap, 0) / (denom + 1e-8)
        return heatmap.numpy()

def save_gradcam_image(img_path, heatmap, output_path, alpha=0.3):
    """Save Grad-CAM visualization to file with enhanced visibility"""
    # Load original image
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Apply threshold to focus on strong activations
    threshold = 0.2
    heatmap_thresholded = heatmap.copy()
    heatmap_thresholded[heatmap_thresholded < threshold] = 0
    
    # Renormalize after thresholding
    if heatmap_thresholded.max() > 0:
        heatmap_thresholded = heatmap_thresholded / heatmap_thresholded.max()
    
    # Resize heatmap to match image size
    heatmap_resized = cv2.resize(heatmap_thresholded, (img.shape[1], img.shape[0]))
    heatmap_resized = np.uint8(255 * heatmap_resized)
    
    # Apply colormap (JET: blue->cyan->green->yellow->red)
    heatmap_colored = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Superimpose heatmap on original image
    superimposed_img = heatmap_colored * alpha + img * (1 - alpha)
    superimposed_img = np.clip(superimposed_img, 0, 255).astype(np.uint8)
    
    # Save the result
    superimposed_img = cv2.cvtColor(superimposed_img, cv2.COLOR_RGB2BGR)
    cv2.imwrite(output_path, superimposed_img)
    return output_path

def image_to_base64(image_path):
    """Convert image to base64 string for JSON response"""
    try:
        with open(image_path, 'rb') as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    except:
        return None

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "model_path": MODEL_PATH,
        "model_type": "VGG19 with Grad-CAM",
        "message": "Malaria Detection API with Grad-CAM is running"
    })

@app.route("/predict", methods=["POST"])
def predict():
    """
    Single image prediction with Grad-CAM visualization
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
            # Preprocess
            x = preprocess_image(filepath)
            
            # Predict
            preds = model.predict(x, verbose=0)
            raw = float(preds[0][0])
            
            # Adjusted threshold based on VGG19 model behavior
            TH = 0.001
            
            predicted = "Parasitized" if raw > TH else "Uninfected"
            
            if predicted == "Parasitized":
                result = "Positive - Parasitized"
                # Confidence calculation for positive
                if raw >= 0.5:
                    conf = 95 + (raw - 0.5) * 10
                elif raw >= 0.01:
                    conf = 80 + (raw - 0.01) * 30
                else:
                    conf = 70 + (raw - TH) * 1000
                conf = min(max(conf, 70), 100)
                visualize_negative = False
            else:
                result = "Negative - Uninfected"
                # Confidence calculation for negative
                conf = 95 + (TH - raw) * 5000
                conf = min(conf, 100)
                visualize_negative = True
            
            # Generate Grad-CAM
            gradcam_base64 = None
            try:
                # Remove activation from last layer for better gradients
                try:
                    model.layers[-1].activation = None
                except:
                    pass
                
                # Generate heatmap
                last_conv_layer_name = "block5_conv3"  # VGG16 last conv layer
                heatmap = make_gradcam_heatmap(
                    x, model, last_conv_layer_name, 
                    pred_index=None, 
                    invert_gradients=visualize_negative
                )
                
                # Save Grad-CAM visualization
                gradcam_filename = f"gradcam_{filename}"
                gradcam_path = os.path.join(GRADCAM_FOLDER, gradcam_filename)
                save_gradcam_image(filepath, heatmap, gradcam_path)
                
                # Convert to base64 for JSON response
                gradcam_base64 = image_to_base64(gradcam_path)
                
                print(f"✅ Grad-CAM generated successfully")
            except Exception as e:
                print(f"⚠️ Grad-CAM generation failed: {e}")
            
            response = {
                "result": result,
                "confidence": round(conf, 2),
                "raw_score": round(raw, 6),
                "interpretation": {
                    "parasitized": predicted == "Parasitized",
                    "class": predicted
                },
                "gradcam": gradcam_base64  # Base64 encoded Grad-CAM image
            }
            
            print(f"✅ Prediction: {result} (Confidence: {response['confidence']}%)")
            
            return jsonify(response)
            
        finally:
            # Clean up temp files
            try:
                os.remove(filepath)
                if gradcam_base64:
                    gradcam_file = os.path.join(GRADCAM_FOLDER, f"gradcam_{filename}")
                    if os.path.exists(gradcam_file):
                        os.remove(gradcam_file)
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
    Multiple images prediction with Grad-CAM (OPTIMIZED for speed)
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
            filepaths.append((idx, file.filename, filepath, filename))
        
        # Preprocess all images into a batch
        batch_images = []
        valid_indices = []
        for idx, original_name, filepath, filename in filepaths:
            try:
                x = preprocess_image(filepath)
                batch_images.append(x[0])
                valid_indices.append((idx, original_name, filepath, filename))
            except Exception as e:
                print(f"⚠️ Failed to preprocess {original_name}: {e}")
        
        # Predict entire batch at once
        if len(batch_images) > 0:
            batch_array = np.array(batch_images)
            print(f"🔬 Analyzing batch of {len(batch_array)} images...")
            preds = model.predict(batch_array, verbose=0)
            
            results = []
            TH = 0.001
            
            # Remove activation from last layer for Grad-CAM
            try:
                model.layers[-1].activation = None
            except:
                pass
            
            for i, (idx, original_name, filepath, filename) in enumerate(valid_indices):
                try:
                    raw = float(preds[i][0])
                    predicted = "Parasitized" if raw > TH else "Uninfected"
                    
                    if predicted == "Parasitized":
                        result = "Positive - Parasitized"
                        if raw >= 0.5:
                            conf = 95 + (raw - 0.5) * 10
                        elif raw >= 0.01:
                            conf = 80 + (raw - 0.01) * 30
                        else:
                            conf = 70 + (raw - TH) * 1000
                        conf = min(max(conf, 70), 100)
                        visualize_negative = False
                    else:
                        result = "Negative - Uninfected"
                        conf = 95 + (TH - raw) * 5000
                        conf = min(conf, 100)
                        visualize_negative = True
                    
                    # Generate Grad-CAM for this image
                    gradcam_base64 = None
                    try:
                        print(f"🎨 Generating Grad-CAM for image {idx}...")
                        x = preprocess_image(filepath)
                        last_conv_layer_name = "block5_conv3"  # VGG16 last conv layer
                        heatmap = make_gradcam_heatmap(
                            x, model, last_conv_layer_name,
                            pred_index=None,
                            invert_gradients=visualize_negative
                        )
                        
                        gradcam_filename = f"gradcam_{filename}"
                        gradcam_path = os.path.join(GRADCAM_FOLDER, gradcam_filename)
                        save_gradcam_image(filepath, heatmap, gradcam_path)
                        gradcam_base64 = image_to_base64(gradcam_path)
                        
                        if gradcam_base64:
                            print(f"✅ Grad-CAM generated successfully for image {idx} (size: {len(gradcam_base64)} bytes)")
                        else:
                            print(f"⚠️ Grad-CAM base64 is empty for image {idx}")
                        
                        # Clean up gradcam file
                        try:
                            os.remove(gradcam_path)
                        except:
                            pass
                    except Exception as e:
                        print(f"❌ Grad-CAM failed for {original_name}: {e}")
                        import traceback
                        traceback.print_exc()
                    
                    results.append({
                        "index": idx,
                        "filename": original_name,
                        "result": result,
                        "confidence": round(conf, 2),
                        "raw_score": round(raw, 6),
                        "gradcam": gradcam_base64  # Add Grad-CAM image
                    })
                except Exception as e:
                    results.append({
                        "index": idx,
                        "filename": original_name,
                        "error": str(e)
                    })
            
            # Clean up all temp files
            for _, _, filepath, _ in filepaths:
                try:
                    os.remove(filepath)
                except:
                    pass
        else:
            results = []
            for _, _, filepath, _ in filepaths:
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
        
        print(f"✅ Batch analysis complete with Grad-CAM for {len(successful)} images")
        
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
    print("\n🚀 Starting Flask server with Grad-CAM support")
    print("📡 API Endpoints:")
    print("   - GET  /health          - Health check")
    print("   - POST /predict         - Single image prediction with Grad-CAM")
    print("   - POST /batch-predict   - Multiple images prediction")
    print("\n✅ Server ready to accept requests!")
    print("=" * 60)
    
    # Get port from environment variable with proper error handling
    try:
        port = int(os.environ.get("PORT", 5000))
    except (ValueError, TypeError):
        port = 5000
        print(f"⚠️  Invalid PORT environment variable, using default port {port}")
    
    print(f"🚀 Starting server on port {port}")
    
    # Run server
    app.run(host="0.0.0.0", port=port, debug=False)
