# 🚀 Quick Start - Deploy Tempmail lên VPS

## 📋 Tổng quan

Deploy backend và frontend lên VPS với:
- **Frontend**: `mail.iceteadev.site` → `localhost:3000`
- **Backend**: `apimail.iceteadev.site` → `localhost:3001`
- **Cloudflare Tunnel**: Tự động SSL và routing

## ⚡ Quick Setup (3 bước)

### Bước 1: Setup Cloudflare Tunnel

**Nếu chưa có tunnel (tạo mới):**
```bash
chmod +x setup-cloudflare-tunnel.sh
./setup-cloudflare-tunnel.sh
```

**Nếu đã có tunnel từ máy local:**
```bash
# 1. Copy credentials từ máy local (chạy trên máy local)
chmod +x copy-tunnel-credentials.sh
./copy-tunnel-credentials.sh

# 2. Setup trên VPS
chmod +x setup-cloudflare-vps.sh
./setup-cloudflare-vps.sh
```

Script sẽ:
- Cài đặt Cloudflare Tunnel
- Đăng nhập vào Cloudflare (nếu cần)
- Tạo/sử dụng tunnel và DNS routes
- Tạo file config

### Bước 2: Cấu hình Environment

```bash
# Backend
cd backend
cp env.production.example .env
nano .env  # Chỉnh sửa với thông tin thực tế

# Frontend  
cd ../frontend
cp env.production.example .env
# File này đã được cấu hình sẵn, không cần chỉnh
```

### Bước 3: Deploy

```bash
cd /root/tempmail
chmod +x deploy.sh
./deploy.sh
```

## 📝 Chi tiết

Xem file `DEPLOYMENT.md` để biết hướng dẫn chi tiết.

## 🔍 Kiểm tra

```bash
# Status
pm2 status

# Logs
pm2 logs

# Test URLs
curl https://mail.iceteadev.site
curl https://apimail.iceteadev.site/health
```

## 🔄 Update Code

```bash
# Pull code mới
git pull

# Rebuild và restart
cd backend && npm install --production && npm run build && cd ..
cd frontend && npm install --production && npm run build && cd ..
pm2 restart all
```
