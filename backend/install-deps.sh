#!/bin/bash
echo "🐍 Installing Python dependencies..."
echo "Python version:"
python3 --version
echo "Pip version:"
python3 -m pip --version
echo "Installing requirements..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
echo "✅ Dependencies installed successfully!"