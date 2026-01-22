# Simple Python Dockerfile for Railway
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and wget for downloading model
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Download the model file from Google Drive if it doesn't exist
RUN if [ ! -f malaria_finetune_stage2_tf215.h5 ]; then \
    echo "Downloading model from Google Drive..."; \
    wget --no-check-certificate 'https://drive.google.com/uc?export=download&id=16NSvxlywn0y12UV6tWZZQxRf1dywM9uJ' -O malaria_finetune_stage2_tf215.h5; \
    echo "Model downloaded successfully!"; \
    fi

# Start the Flask app
CMD ["python", "malaria_api_gradcam.py"]
