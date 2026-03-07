#!/bin/bash

# AllCanLearn-v6 - Run Tunnel

set -e

echo "🌐 AllCanLearn-v6 - Starting Tunnel"
echo "=================================="
echo ""

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if app is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ App is not running. Starting app first..."
    ./start.sh &
    sleep 15
fi

# Check if tunnel config exists
if [ ! -f ~/.cloudflared/config.yml ]; then
    echo "❌ Tunnel config not found. Run ./setup-domain.sh first"
    exit 1
fi

# Extract tunnel name
TUNNEL_NAME=$(grep "tunnel:" ~/.cloudflared/config.yml | head -1 | awk "{print \$2}")

echo "�� Starting tunnel: $TUNNEL_NAME"
echo "🌐 Your app will be available at your configured domain"
echo "🌐 Local: http://localhost:8000"
echo ""

# Start tunnel
export PATH=$PATH:~/bin
cloudflared tunnel --config ~/.cloudflared/config.yml run $TUNNEL_NAME
