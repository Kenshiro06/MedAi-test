# Simple Python Dockerfile for Railway
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install gdown for Google Drive downloads
RUN pip install --no-cache-dir gdown

# Copy application files
COPY . .

# Download the model file from Google Drive
RUN echo "=== Checking for model file ===" && \
    if [ ! -f malaria_finetune_stage2_tf215.h5 ]; then \
        echo "Model not found, downloading from Google Drive..."; \
        gdown --fuzzy https://drive.google.com/file/d/1iKuu-mNQuZWVyhcN4IghdrtczI9NM9Io/view?usp=sharing -O malaria_finetune_stage2_tf215.h5 && \
        echo "=== Download complete ===" && \
        ls -lh malaria_finetune_stage2_tf215.h5 && \
        file malaria_finetune_stage2_tf215.h5; \
    else \
        echo "Model file already exists"; \
        ls -lh malaria_finetune_stage2_tf215.h5; \
    fi

# Start the Flask app
CMD ["python", "malaria_api_gradcam.py"]
