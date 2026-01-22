#!/bin/bash

# 🚂 Railway Setup Script for MedAI Platform
echo "🚂 Setting up MedAI for Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Please login to Railway..."
railway login

# Create new project
echo "📦 Creating new Railway project..."
railway init

# Deploy backend
echo "🐍 Deploying backend service..."
cd backend
railway up --service backend

# Deploy frontend
echo "⚛️  Deploying frontend service..."
cd ..
railway up --service frontend

echo "✅ Railway setup complete!"
echo "📋 Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Update VITE_API_URL with your backend URL"
echo "3. Test your deployment"
echo ""
echo "🌐 Access your Railway dashboard: https://railway.app/dashboard"