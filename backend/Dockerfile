# Simple Python Dockerfile for Railway
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies and git-lfs
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    git \
    git-lfs \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Download model file if not present (Railway might not pull LFS files)
RUN if [ ! -f malaria_finetune_stage2_tf215.h5 ] || [ ! -s malaria_finetune_stage2_tf215.h5 ]; then \
    echo "Model file missing or empty, downloading..."; \
    curl -L "https://github.com/Kenshiro06/MedAi-test/raw/main/backend/malaria_finetune_stage2_tf215.h5" -o malaria_finetune_stage2_tf215.h5 || \
    (pip install gdown && gdown --id 1iKuu-mNQuZWVyhcN4IghdrtczI9NM9Io -O malaria_finetune_stage2_tf215.h5); \
    fi && \
    echo "Verifying model file:" && \
    ls -lh malaria_finetune_stage2_tf215.h5 && \
    file malaria_finetune_stage2_tf215.h5

# Start the Flask app
CMD ["python", "malaria_api_gradcam.py"]
