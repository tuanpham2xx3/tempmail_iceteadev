#!/bin/bash

# Setup Cloudflare Tunnel trên VPS
# Sử dụng script này nếu đã tạo tunnel từ máy local

set -e

echo "☁️  Cloudflare Tunnel Setup trên VPS"
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
echo "This will open a browser window. Login and authorize."
cloudflared tunnel login

# List existing tunnels
echo ""
echo "📋 Listing existing tunnels..."
cloudflared tunnel list

# Ask user for tunnel name or ID
echo ""
echo "Enter tunnel name (e.g., 'tempmail') or tunnel ID:"
read -r TUNNEL_INPUT

# Check if it's a tunnel name or ID
if cloudflared tunnel info "$TUNNEL_INPUT" &>/dev/null; then
    TUNNEL_NAME="$TUNNEL_INPUT"
    TUNNEL_ID=$(cloudflared tunnel info "$TUNNEL_NAME" 2>/dev/null | grep -oP 'ID:\s+\K[a-z0-9-]+' || echo "")
    
    if [ -z "$TUNNEL_ID" ]; then
        echo "⚠️  Could not get tunnel ID. Please enter manually:"
        read -r TUNNEL_ID
    fi
else
    # Assume it's a tunnel ID
    TUNNEL_ID="$TUNNEL_INPUT"
    TUNNEL_NAME=""
fi

echo ""
echo "📝 Using Tunnel ID: $TUNNEL_ID"

# Check if credentials file exists
CREDENTIALS_FILE="/root/.cloudflared/$TUNNEL_ID.json"
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo ""
    echo "⚠️  Credentials file not found at $CREDENTIALS_FILE"
    echo ""
    echo "You need to copy the credentials file from your local machine:"
    echo "1. On your local machine, find: ~/.cloudflared/$TUNNEL_ID.json"
    echo "2. Copy it to VPS: scp ~/.cloudflared/$TUNNEL_ID.json root@your-vps:/root/.cloudflared/"
    echo ""
    echo "Or if you have the file locally, enter the path to copy:"
    read -r LOCAL_CRED_PATH
    
    if [ -n "$LOCAL_CRED_PATH" ] && [ -f "$LOCAL_CRED_PATH" ]; then
        mkdir -p /root/.cloudflared
        cp "$LOCAL_CRED_PATH" "$CREDENTIALS_FILE"
        chmod 600 "$CREDENTIALS_FILE"
        echo "✅ Credentials file copied"
    else
        echo "❌ Credentials file not found. Please copy it manually."
        exit 1
    fi
else
    echo "✅ Credentials file found"
fi

# Create DNS routes if not exists
echo ""
echo "🌐 Setting up DNS routes..."
echo "Checking if routes exist..."

# Check and create route for mail.iceteadev.site
if ! cloudflared tunnel route dns list | grep -q "mail.iceteadev.site"; then
    echo "Creating DNS route for mail.iceteadev.site..."
    if [ -n "$TUNNEL_NAME" ]; then
        cloudflared tunnel route dns "$TUNNEL_NAME" mail.iceteadev.site || echo "⚠️  Failed to create route (may already exist)"
    else
        cloudflared tunnel route dns "$TUNNEL_ID" mail.iceteadev.site || echo "⚠️  Failed to create route (may already exist)"
    fi
else
    echo "✅ Route for mail.iceteadev.site already exists"
fi

# Check and create route for apimail.iceteadev.site
if ! cloudflared tunnel route dns list | grep -q "apimail.iceteadev.site"; then
    echo "Creating DNS route for apimail.iceteadev.site..."
    if [ -n "$TUNNEL_NAME" ]; then
        cloudflared tunnel route dns "$TUNNEL_NAME" apimail.iceteadev.site || echo "⚠️  Failed to create route (may already exist)"
    else
        cloudflared tunnel route dns "$TUNNEL_ID" apimail.iceteadev.site || echo "⚠️  Failed to create route (may already exist)"
    fi
else
    echo "✅ Route for apimail.iceteadev.site already exists"
fi

# Create config directory
mkdir -p /root/.cloudflared

# Create config file
echo ""
echo "📄 Creating tunnel configuration..."
cat > /root/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDENTIALS_FILE

ingress:
  # Frontend - mail.iceteadev.site -> localhost:3000
  - hostname: mail.iceteadev.site
    service: http://localhost:3000
  
  # Backend API - apimail.iceteadev.site -> localhost:3001
  - hostname: apimail.iceteadev.site
    service: http://localhost:3001
  
  # Catch-all rule
  - service: http_status:404
EOF

chmod 600 /root/.cloudflared/config.yml
echo "✅ Configuration saved to /root/.cloudflared/config.yml"

# Test tunnel
echo ""
echo "🧪 Testing tunnel configuration..."
echo "Press Ctrl+C to stop the test"
sleep 2
cloudflared tunnel --config /root/.cloudflared/config.yml run
