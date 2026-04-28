#!/bin/bash

# Quick setup script for Cloudflare Tunnel
# Run this script to set up Cloudflare Tunnel on VPS

set -e

echo "☁️  Cloudflare Tunnel Setup Script"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing Cloudflare Tunnel..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
    echo "✅ Cloudflare Tunnel installed"
else
    echo "✅ Cloudflare Tunnel already installed"
fi

# Login to Cloudflare
echo ""
echo "🔐 Please login to Cloudflare..."
cloudflared tunnel login

# Create tunnel
echo ""
echo "🔨 Creating tunnel 'tempmail'..."
TUNNEL_OUTPUT=$(cloudflared tunnel create tempmail 2>&1)
echo "$TUNNEL_OUTPUT"

# Extract tunnel ID (format: Created tunnel abc123-def456-ghi789)
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel \K[a-z0-9-]+' || echo "")

if [ -z "$TUNNEL_ID" ]; then
    echo "⚠️  Could not extract tunnel ID automatically"
    echo "Please enter your Tunnel ID manually:"
    read -r TUNNEL_ID
fi

echo ""
echo "📝 Tunnel ID: $TUNNEL_ID"

# Create DNS routes
echo ""
echo "🌐 Creating DNS routes..."
cloudflared tunnel route dns tempmail mail.khoahoctietkiem.site
cloudflared tunnel route dns tempmail apimail.khoahoctietkiem.site

# Create config directory
mkdir -p /root/.cloudflared

# Create config file
echo ""
echo "📄 Creating tunnel configuration..."
cat > /root/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  # Frontend - mail.khoahoctietkiem.site -> localhost:3000
  - hostname: mail.khoahoctietkiem.site
    service: http://localhost:3000
  
  # Backend API - apimail.khoahoctietkiem.site -> localhost:3001
  - hostname: apimail.khoahoctietkiem.site
    service: http://localhost:3001
  
  # Catch-all rule
  - service: http_status:404
EOF

echo "✅ Configuration saved to /root/.cloudflared/config.yml"

# Test tunnel
echo ""
echo "🧪 Testing tunnel configuration..."
echo "Press Ctrl+C to stop the test"
sleep 2
cloudflared tunnel --config /root/.cloudflared/config.yml run
