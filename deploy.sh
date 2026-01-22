#!/bin/bash

# Deployment script for Tempmail VPS
# This script sets up and deploys the application

set -e

echo "🚀 Starting Tempmail Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install Node.js 20.x if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
fi

# Install Cloudflare Tunnel if not installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Cloudflare Tunnel...${NC}"
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
fi

# Create logs directory
mkdir -p logs

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install --production
npm run build
cd ..

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install --production
npm run build
cd ..

# Copy production environment files
echo -e "${YELLOW}📝 Setting up environment files...${NC}"
if [ ! -f backend/.env ]; then
    if [ -f backend/env.production.example ]; then
        cp backend/env.production.example backend/.env
        echo "Created backend/.env from env.production.example"
        echo "⚠️  Please edit backend/.env with your actual credentials"
    else
        echo "⚠️  backend/env.production.example not found, please create backend/.env manually"
    fi
fi

if [ ! -f frontend/.env ]; then
    if [ -f frontend/env.production.example ]; then
        cp frontend/env.production.example frontend/.env
        echo "Created frontend/.env from env.production.example"
    else
        echo "⚠️  frontend/env.production.example not found, please create frontend/.env manually"
    fi
fi

# Setup Cloudflare Tunnel
echo -e "${YELLOW}☁️  Setting up Cloudflare Tunnel...${NC}"
mkdir -p /root/.cloudflared

# Check if tunnel config exists
if [ ! -f /root/.cloudflared/config.yml ]; then
    echo "⚠️  Cloudflare tunnel config not found at /root/.cloudflared/config.yml"
    echo "Please run: cloudflared tunnel create tempmail"
    echo "Then copy the tunnel ID and credentials file"
    echo "Update cloudflare-tunnel-config.yml with your tunnel ID"
    echo "Copy cloudflare-tunnel-config.yml to /root/.cloudflared/config.yml"
    exit 1
fi

# Start services with PM2
echo -e "${YELLOW}🔄 Starting services with PM2...${NC}"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs"
echo "🔄 Restart: pm2 restart all"
echo ""
echo "🌐 Frontend: https://mail.iceteadev.site"
echo "🔌 Backend API: https://apimail.iceteadev.site"
