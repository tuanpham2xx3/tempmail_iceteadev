#!/bin/bash

# Script để copy Cloudflare Tunnel credentials từ máy local lên VPS
# Chạy script này trên máy local (không phải VPS)

set -e

echo "📋 Copy Cloudflare Tunnel Credentials"
echo "======================================"
echo ""

# Get tunnel name or ID
echo "Enter tunnel name (e.g., 'tempmail') or tunnel ID:"
read -r TUNNEL_INPUT

# Find credentials file
LOCAL_CRED_FILE="$HOME/.cloudflared/$TUNNEL_INPUT.json"

# Try to find by tunnel name first
if [ ! -f "$LOCAL_CRED_FILE" ]; then
    # List all credential files
    echo ""
    echo "Available credential files in ~/.cloudflared/:"
    ls -la ~/.cloudflared/*.json 2>/dev/null || echo "No .json files found"
    echo ""
    echo "Enter the full path to credentials file:"
    read -r LOCAL_CRED_FILE
fi

if [ ! -f "$LOCAL_CRED_FILE" ]; then
    echo "❌ Credentials file not found: $LOCAL_CRED_FILE"
    exit 1
fi

# Extract tunnel ID from filename or file content
TUNNEL_ID=$(basename "$LOCAL_CRED_FILE" .json)
echo "📝 Tunnel ID: $TUNNEL_ID"

# Get VPS connection info
echo ""
echo "Enter VPS connection info:"
echo "Format: user@host (e.g., root@123.45.67.89)"
read -r VPS_CONNECTION

# Create .cloudflared directory on VPS and copy file
echo ""
echo "📤 Copying credentials to VPS..."
ssh "$VPS_CONNECTION" "mkdir -p /root/.cloudflared && chmod 700 /root/.cloudflared"
scp "$LOCAL_CRED_FILE" "$VPS_CONNECTION:/root/.cloudflared/$TUNNEL_ID.json"
ssh "$VPS_CONNECTION" "chmod 600 /root/.cloudflared/$TUNNEL_ID.json"

echo ""
echo "✅ Credentials copied successfully!"
echo ""
echo "Next steps on VPS:"
echo "1. Run: ./setup-cloudflare-vps.sh"
echo "2. Or manually create /root/.cloudflared/config.yml with:"
echo ""
echo "tunnel: $TUNNEL_ID"
echo "credentials-file: /root/.cloudflared/$TUNNEL_ID.json"
echo ""
echo "ingress:"
echo "  - hostname: mail.khoahoctietkiem.site"
echo "    service: http://localhost:3000"
echo "  - hostname: apimail.khoahoctietkiem.site"
echo "    service: http://localhost:3001"
echo "  - service: http_status:404"
