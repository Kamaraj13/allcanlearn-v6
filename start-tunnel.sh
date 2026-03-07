#!/bin/bash

# AllCanLearn-v6 - Start Cloudflare Tunnel

set -e

echo "🌐 AllCanLearn-v6 - Starting Cloudflare Tunnel"
echo "=========================================="
echo ""

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if tunnel config exists
if [ ! -f ~/.cloudflared/config.yml ]; then
    echo "❌ Tunnel config not found. Run ./setup-cloudflare.sh first"
    exit 1
fi

# Extract tunnel name from config
TUNNEL_NAME=$(grep "tunnel:" ~/.cloudflared/config.yml | head -1 | awk "{print \$2}")

echo "🚇 Starting tunnel: $TUNNEL_NAME"
echo "🌐 Your app will be available at your configured domain"
echo ""

# Start tunnel
cloudflared tunnel --config ~/.cloudflared/config.yml run $TUNNEL_NAME
