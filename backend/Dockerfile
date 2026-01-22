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

# Copy application files (including model)
COPY . .

# Verify model file exists
RUN ls -lh malaria_finetune_stage2_tf215.h5 && \
    echo "Model file found and ready!"

# Start the Flask app
CMD ["python", "malaria_api_gradcam.py"]
