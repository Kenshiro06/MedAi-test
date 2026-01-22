#!/usr/bin/env python3
"""
Railway deployment script for MedAI Backend
Simple one-file solution to install dependencies and start Flask API
"""
import subprocess
import sys
import os

def run_command(cmd):
    """Run command and show output"""
    print(f"🔧 Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(f"⚠️ Warning: {result.stderr}")
    return result.returncode == 0

def main():
    print("🚀 MedAI Backend - Railway Deployment")
    print("=" * 50)
    
    # Check Python version
    print("🐍 Python version:")
    run_command("python --version")
    run_command("python3 --version")
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    if not run_command("python -m pip install --upgrade pip"):
        print("❌ Failed to upgrade pip with python, trying python3...")
        run_command("python3 -m pip install --upgrade pip")
    
    if not run_command("python -m pip install -r requirements.txt"):
        print("❌ Failed to install with python, trying python3...")
        run_command("python3 -m pip install -r requirements.txt")
    
    print("\n✅ Dependencies installed!")
    print("🚀 Starting MedAI Flask API...")
    
    # Start the Flask app
    try:
        import malaria_api_gradcam
    except ImportError:
        print("❌ Failed to import malaria_api_gradcam")
        sys.exit(1)

if __name__ == "__main__":
    main()