#!/bin/bash

# AllCanLearn-v6 - Portable Cloudflare Setup
# Sets up Cloudflare tunnel for domain access

set -e

echo "🌐 AllCanLearn-v6 - Cloudflare Setup"
echo "=================================="
echo ""

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."
    # For Linux
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        ARCH=$(uname -m)
        if [ "$ARCH" = "x86_64" ]; then
            curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
        elif [ "$ARCH" = "aarch64" ]; then
            curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
        fi
        chmod +x cloudflared
        sudo mv cloudflared /usr/local/bin/ 2>/dev/null || mv cloudflared ~/bin/
        export PATH=$PATH:~/bin
    else
        echo "❌ Please install cloudflared manually from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
        exit 1
    fi
fi

echo "✅ cloudflared installed"

# Login to Cloudflare
echo "🔐 Logging into Cloudflare..."
cloudflared tunnel login

# Get domain from user
echo ""
echo "📝 Enter your domain (e.g., allcanlearn.uk):"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required"
    exit 1
fi

# Create tunnel
echo "🚇 Creating tunnel..."
TUNNEL_NAME="allcanlearn-$(echo $DOMAIN | cut -d. -f1)"
TUNNEL_ID=$(cloudflared tunnel create $TUNNEL_NAME --output json | jq -r .result.uuid)

echo "✅ Tunnel created: $TUNNEL_NAME ($TUNNEL_ID)"

# Create config
echo "📝 Creating config..."
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << ENVEOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:8000
  - hostname: www.$DOMAIN
    service: http://localhost:8000
  - service: http_status:404
ENVEOF

# Route DNS
echo "🌐 Setting up DNS routes..."
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN
cloudflared tunnel route dns $TUNNEL_NAME www.$DOMAIN

echo "✅ Cloudflare setup complete!"
echo ""
echo "🚀 Start tunnel with: ./start-tunnel.sh"
echo "�� Your app will be available at: https://$DOMAIN"
