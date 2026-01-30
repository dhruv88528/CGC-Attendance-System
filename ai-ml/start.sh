#!/bin/bash

# AI/ML FaceNet Face Recognition Service Startup Script
# This script starts the AI service with proper configuration
# Using FaceNet (InceptionResnetV1 + MTCNN) for face recognition

set -e  # Exit on error

echo "🚀 Starting Automated Attendance System - FaceNet AI/ML Service"
echo "================================================================"

# Load environment variables
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Using default environment variables."
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p logs
mkdir -p data/temp
mkdir -p cache

# FaceNet models are downloaded automatically by facenet-pytorch
# They are cached in ~/.cache/torch/hub/checkpoints/
echo "📦 FaceNet models will be downloaded automatically on first run"
echo "   Models: InceptionResnetV1 (VGGFace2 pretrained) + MTCNN"

# Install Python dependencies if needed
if [ ! -d "venv" ] && [ "$1" != "--no-venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
fi

# Clean cache
echo "🧹 Cleaning cache..."
rm -rf cache/*

# Set Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Check MongoDB connection
if [ -n "$MONGODB_URI" ]; then
    echo "🔗 Checking MongoDB connection..."
    python3 -c "
import sys
try:
    from pymongo import MongoClient
    from urllib.parse import quote_plus
    import os
    client = MongoClient('$MONGODB_URI', serverSelectionTimeoutMS=5000)
    client.server_info()
    print('✅ MongoDB connection successful')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    sys.exit(1)
"
fi

# Check for GPU availability
echo ""
echo "🔍 Checking GPU availability..."
python3 -c "
import torch
if torch.cuda.is_available():
    print(f'✅ GPU Available: {torch.cuda.get_device_name(0)}')
    print(f'   CUDA Version: {torch.version.cuda}')
else:
    print('⚠️  No GPU found. Running on CPU (slower but functional)')
"

# Start the service
echo ""
echo "🚀 Starting FaceNet Face Recognition Service..."
echo "📊 Mode: ${FLASK_ENV:-production}"
echo "🔌 Port: ${PORT:-8000}"
echo "🤖 Model: FaceNet (InceptionResnetV1 + MTCNN)"
echo "📐 Embedding: 512-D vectors"
echo "📏 Matching: Cosine Similarity (threshold: 0.6)"
echo ""
echo "📡 Available endpoints:"
echo "   → http://localhost:${PORT:-8000}/health"
echo "   → http://localhost:${PORT:-8000}/api/detect"
echo "   → http://localhost:${PORT:-8000}/api/register-face"
echo "   → http://localhost:${PORT:-8000}/api/recognize-attendance"
echo "   → http://localhost:${PORT:-8000}/api/verify-face"
echo ""
echo "📝 Logs will be written to: logs/ai_service.log"
echo "================================================================"

# Run the service
if [ "$FLASK_ENV" = "development" ]; then
    echo "🔧 Starting in development mode..."
    python3 api/app.py
else
    echo "🏭 Starting in production mode with Gunicorn..."
    gunicorn \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers 4 \
        --threads 2 \
        --timeout 120 \
        --access-logfile logs/access.log \
        --error-logfile logs/error.log \
        --log-level info \
        api.app:app
fi