# Simple Python Dockerfile for Railway
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install gdown for downloading model
RUN pip install --no-cache-dir gdown

# Copy application files
COPY . .

# Download model file from Google Drive
RUN echo "Downloading model from Google Drive..." && \
    gdown --id 1iKuu-mNQuZWVyhcN4IghdrtczI9NM9Io -O malaria_finetune_stage2_tf215.h5 && \
    echo "Model downloaded successfully!" && \
    ls -lh malaria_finetune_stage2_tf215.h5

# Start the Flask app
CMD ["python", "malaria_api_gradcam.py"]
