# 🚀 Hướng dẫn Deploy Tempmail lên VPS

Hướng dẫn chi tiết để deploy backend và frontend lên VPS sandbox với Cloudflare Tunnel.

## 📋 Yêu cầu

- VPS Ubuntu/Debian
- Domain `iceteadev.site` đã được quản lý bởi Cloudflare
- Quyền root trên VPS
- Cloudflare account với quyền quản lý domain

## 🔧 Bước 1: Cài đặt Cloudflare Tunnel trên VPS

### 1.1. SSH vào VPS

```bash
ssh root@your-vps-ip
```

### 1.2. Tạo Cloudflare Tunnel (Chọn 1 trong 2 cách)

#### Cách 1: Tạo tunnel mới trên VPS (Khuyến nghị)

```bash
# Cài đặt cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb

# Đăng nhập vào Cloudflare
cloudflared tunnel login

# Tạo tunnel mới
cloudflared tunnel create tempmail

# Lưu ý Tunnel ID được tạo ra (ví dụ: abc123-def456-ghi789)
```

#### Cách 2: Sử dụng tunnel đã tạo từ máy local

Nếu bạn đã tạo tunnel từ máy local, bạn cần:

1. **Copy credentials file từ máy local lên VPS:**

```bash
# Trên máy local, chạy script:
chmod +x copy-tunnel-credentials.sh
./copy-tunnel-credentials.sh

# Hoặc copy thủ công:
scp ~/.cloudflared/<TUNNEL_ID>.json root@your-vps:/root/.cloudflared/
```

2. **Setup tunnel trên VPS:**

```bash
# Trên VPS
chmod +x setup-cloudflare-vps.sh
./setup-cloudflare-vps.sh
```

### 1.3. Cấu hình DNS Routes

```bash
# Tạo route cho frontend
cloudflared tunnel route dns tempmail mail.iceteadev.site

# Tạo route cho backend API
cloudflared tunnel route dns tempmail apimail.iceteadev.site
```

### 1.4. Tạo file cấu hình tunnel

```bash
mkdir -p /root/.cloudflared

# Tạo file config.yml
nano /root/.cloudflared/config.yml
```

Nội dung file `/root/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>  # Thay bằng Tunnel ID của bạn
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Frontend - mail.iceteadev.site -> localhost:3000
  - hostname: mail.iceteadev.site
    service: http://localhost:3000
  
  # Backend API - apimail.iceteadev.site -> localhost:3001
  - hostname: apimail.iceteadev.site
    service: http://localhost:3001
  
  # Catch-all rule
  - service: http_status:404
```

**Lưu ý:** Thay `<TUNNEL_ID>` bằng Tunnel ID thực tế của bạn. File credentials sẽ được tạo tự động khi chạy `cloudflared tunnel create`.

### 1.5. Test tunnel

```bash
# Test tunnel
cloudflared tunnel --config /root/.cloudflared/config.yml run
```

Nếu không có lỗi, nhấn `Ctrl+C` để dừng.

## 📦 Bước 2: Upload code lên VPS

### 2.1. Clone hoặc upload code

```bash
# Tạo thư mục project
mkdir -p /root/tempmail
cd /root/tempmail

# Upload code bằng SCP hoặc clone từ Git
# Ví dụ với Git:
# git clone <your-repo-url> .
```

### 2.2. Cấu trúc thư mục trên VPS

```
/root/tempmail/
├── backend/
├── frontend/
├── cloudflare-tunnel-config.yml
├── ecosystem.config.js
├── deploy.sh
└── logs/
```

## ⚙️ Bước 3: Cấu hình Environment Variables

### 3.1. Backend `.env`

Tạo file `backend/.env`:

```bash
cd /root/tempmail/backend
nano .env
```

Nội dung:

```env
# Gmail Configuration
GMAIL_EMAIL=phamtuan2xx3@gmail.com
GMAIL_APP_PASSWORD=elxkvsccnufclkfb

# Server Configuration
PORT=3001
NODE_ENV=production

# IMAP Configuration
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# Email Domain
ALLOWED_DOMAIN=iceteadev.site
EMAIL_FETCH_MINUTES=10
```

### 3.2. Frontend `.env`

Tạo file `frontend/.env`:

```bash
cd /root/tempmail/frontend
nano .env
```

Nội dung:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://apimail.iceteadev.site/api

# Next.js Configuration
NODE_ENV=production
PORT=3000
```

## 🚀 Bước 4: Deploy Application

### 4.1. Chạy script deploy tự động

```bash
cd /root/tempmail
chmod +x deploy.sh
./deploy.sh
```

### 4.2. Hoặc deploy thủ công

```bash
# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Cài đặt PM2
npm install -g pm2

# Build backend
cd backend
npm install --production
npm run build
cd ..

# Build frontend
cd frontend
npm install --production
npm run build
cd ..

# Tạo logs directory
mkdir -p logs

# Start với PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ✅ Bước 5: Kiểm tra và Quản lý

### 5.1. Kiểm tra status

```bash
# Xem status tất cả services
pm2 status

# Xem logs
pm2 logs

# Xem logs của từng service
pm2 logs tempmail-backend
pm2 logs tempmail-frontend
pm2 logs cloudflare-tunnel
```

### 5.2. Quản lý services

```bash
# Restart tất cả
pm2 restart all

# Restart từng service
pm2 restart tempmail-backend
pm2 restart tempmail-frontend
pm2 restart cloudflare-tunnel

# Stop services
pm2 stop all

# Xóa services
pm2 delete all
```

### 5.3. Kiểm tra ứng dụng

- Frontend: https://mail.iceteadev.site
- Backend API: https://apimail.iceteadev.site/health

## 🔄 Bước 6: Update Code

Khi cần update code:

```bash
cd /root/tempmail

# Pull code mới (nếu dùng Git)
# git pull

# Rebuild và restart
cd backend
npm install --production
npm run build
cd ../frontend
npm install --production
npm run build
cd ..

# Restart với PM2
pm2 restart all
```

## 🛠️ Troubleshooting

### Lỗi Cloudflare Tunnel

```bash
# Kiểm tra tunnel config
cloudflared tunnel --config /root/.cloudflared/config.yml run

# Kiểm tra DNS routes
cloudflared tunnel route dns list
```

### Lỗi PM2

```bash
# Xem logs chi tiết
pm2 logs --lines 100

# Kiểm tra process
ps aux | grep node
```

### Lỗi Port đã được sử dụng

```bash
# Kiểm tra port
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Kill process nếu cần
kill -9 <PID>
```

### Lỗi Build

```bash
# Xóa node_modules và rebuild
cd backend
rm -rf node_modules package-lock.json
npm install --production
npm run build

cd ../frontend
rm -rf node_modules package-lock.json .next
npm install --production
npm run build
```

## 📝 Notes

- **Security**: Đảm bảo file `.env` không được commit lên Git
- **Backup**: Nên backup file `.env` và credentials của Cloudflare Tunnel
- **Monitoring**: Có thể setup monitoring với PM2 Plus hoặc các tools khác
- **SSL**: Cloudflare Tunnel tự động cung cấp SSL certificate

## 🔐 Security Checklist

- [ ] File `.env` có quyền 600 (chmod 600)
- [ ] Cloudflare Tunnel credentials được bảo vệ
- [ ] Firewall chỉ mở các port cần thiết
- [ ] Gmail App Password được bảo mật
- [ ] PM2 logs được rotate định kỳ
