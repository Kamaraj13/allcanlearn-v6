#!/bin/bash

# AllCanLearn-v6 - Domain Setup Script

set -e

echo "🌐 AllCanLearn-v6 - Domain Setup"
echo "================================"
echo ""

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if app is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ App is not running on port 8000"
    echo "�� Starting app first..."
    ./start.sh &
    sleep 10
fi

echo "✅ App is running on port 8000"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
    chmod +x cloudflared
    sudo mv cloudflared /usr/local/bin/ 2>/dev/null || mv cloudflared ~/bin/
    export PATH=$PATH:~/bin
fi

echo "✅ cloudflared installed"

# Create tunnel
echo "🚇 Creating tunnel..."
TUNNEL_NAME="allcanlearn-v6"
TUNNEL_ID=$(cloudflared tunnel create $TUNNEL_NAME --output json 2>/dev/null | jq -r .result.uuid 2>/dev/null || echo "")

if [ -z "$TUNNEL_ID" ]; then
    echo "⚠️  Please login to Cloudflare first:"
    echo "🔐 Run: cloudflared tunnel login"
    echo "📝 Then visit the URL in your browser"
    echo "🔄 After login, run this script again"
    exit 1
fi

echo "✅ Tunnel created: $TUNNEL_NAME ($TUNNEL_ID)"

# Create config
echo "📝 Creating config..."
cat > ~/.cloudflared/config.yml << ENVEOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: allcanlearn.uk
    service: http://localhost:8000
  - hostname: www.allcanlearn.uk
    service: http://localhost:8000
  - service: http_status:404
ENVEOF

# Route DNS
echo "🌐 Setting up DNS routes..."
cloudflared tunnel route dns $TUNNEL_NAME allcanlearn.uk
cloudflared tunnel route dns $TUNNEL_NAME www.allcanlearn.uk

echo "✅ Domain setup complete!"
echo ""
echo "🚀 Start tunnel with: ./start-tunnel.sh"
echo "🌐 Your app will be available at: https://allcanlearn.uk"
echo "�� And also at: https://www.allcanlearn.uk"
