#!/bin/bash

# AllCanLearn-v6 - Portable Startup Script
# Works on any system with Python 3.8+

set -e

echo "🎙️ AllCanLearn-v6 - Portable Startup"
echo "=================================="
echo ""

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Python version
PYTHON_VERSION=$(python3 -c "import sys; print(\".\".join(map(str, sys.version_info[:2])))")
REQUIRED_VERSION="3.8"

if [ "$(printf "%s\n" "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $REQUIRED_VERSION+ required. Found: $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"

# Create virtual environment if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip >/dev/null 2>&1

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "❌ requirements.txt not found"
    exit 1
fi

# Create necessary directories
echo "�� Creating directories..."
mkdir -p tts_output episodes_data app/static

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << ENVEOF
# AllCanLearn-v6 Environment Variables
GROQ_API_KEY=your_groq_api_key_here
NGROK_AUTHTOKEN=your_ngrok_token_here
ENVEOF
    echo "📝 Please edit .env file and add your API keys"
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 Starting AllCanLearn-v6 server..."
echo "🌐 Local: http://localhost:8000"
echo "🌐 Network: http://0.0.0.0:8000"
echo ""

# Start server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
