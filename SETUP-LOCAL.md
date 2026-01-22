# 📋 Checklist - Chuẩn bị trên máy Local

Các bước cần làm trên máy local trước khi deploy lên VPS.

## ✅ Bước 1: Kiểm tra Cloudflare Tunnel

### 1.1. Kiểm tra xem đã có tunnel chưa

```bash
# Kiểm tra cloudflared đã cài chưa
cloudflared --version

# Xem danh sách tunnels
cloudflared tunnel list
```

### 1.2. Nếu chưa có tunnel, tạo mới (tùy chọn)

```bash
# Đăng nhập Cloudflare (nếu chưa)
cloudflared tunnel login

# Tạo tunnel mới
cloudflared tunnel create tempmail

# Lưu ý Tunnel ID được tạo ra
```

**Lưu ý:** Bạn có thể tạo tunnel trên máy local hoặc trên VPS đều được.

### 1.3. Tìm credentials file

```bash
# Xem các credentials files
ls -la ~/.cloudflared/*.json

# File sẽ có dạng: ~/.cloudflared/<TUNNEL_ID>.json
```

## ✅ Bước 2: Chuẩn bị code để upload

### 2.1. Kiểm tra code đã sẵn sàng

```bash
# Đảm bảo code đã commit (nếu dùng Git)
git status

# Test build local (tùy chọn)
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

### 2.2. Chuẩn bị file cần thiết

Đảm bảo các file sau có trong project:
- ✅ `deploy.sh`
- ✅ `setup-cloudflare-tunnel.sh` (nếu tạo tunnel mới trên VPS)
- ✅ `setup-cloudflare-vps.sh` (nếu dùng tunnel có sẵn)
- ✅ `copy-tunnel-credentials.sh` (nếu copy credentials từ local)
- ✅ `ecosystem.config.js`
- ✅ `backend/env.production.example`
- ✅ `frontend/env.production.example`

## ✅ Bước 3: Copy Credentials lên VPS (nếu đã có tunnel)

### 3.1. Sử dụng script tự động (Khuyến nghị)

```bash
# Chạy script copy credentials
chmod +x copy-tunnel-credentials.sh
./copy-tunnel-credentials.sh
```

Script sẽ hỏi:
- Tunnel name hoặc ID
- VPS connection info (ví dụ: `root@123.45.67.89`)

### 3.2. Hoặc copy thủ công

```bash
# Tìm Tunnel ID
cloudflared tunnel list

# Copy credentials file
scp ~/.cloudflared/<TUNNEL_ID>.json root@your-vps-ip:/root/.cloudflared/
```

**Ví dụ:**
```bash
scp ~/.cloudflared/abc123-def456-ghi789.json root@123.45.67.89:/root/.cloudflared/
```

## ✅ Bước 4: Upload code lên VPS

### 4.1. Sử dụng Git (Khuyến nghị)

```bash
# Trên VPS
ssh root@your-vps-ip
cd /root
git clone <your-repo-url> tempmail
cd tempmail
```

### 4.2. Hoặc dùng SCP

```bash
# Từ máy local, upload toàn bộ project
scp -r . root@your-vps-ip:/root/tempmail/
```

### 4.3. Hoặc dùng rsync (tốt hơn SCP)

```bash
# Upload code (bỏ qua node_modules, .next, etc.)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dist' \
  --exclude '.git' --exclude 'logs' \
  ./ root@your-vps-ip:/root/tempmail/
```

## ✅ Bước 5: Test local (Tùy chọn)

Trước khi deploy, có thể test local:

```bash
# Backend
cd backend
npm install
npm run dev
# Test: http://localhost:3001/health

# Frontend (terminal mới)
cd frontend
npm install
npm run dev
# Test: http://localhost:3000
```

## 📝 Tóm tắt nhanh

**Nếu đã có Cloudflare Tunnel:**
1. ✅ Copy credentials: `./copy-tunnel-credentials.sh`
2. ✅ Upload code lên VPS (Git/SCP/rsync)
3. ✅ Trên VPS: Chạy `./setup-cloudflare-vps.sh`
4. ✅ Trên VPS: Chạy `./deploy.sh`

**Nếu chưa có Cloudflare Tunnel:**
1. ✅ Upload code lên VPS
2. ✅ Trên VPS: Chạy `./setup-cloudflare-tunnel.sh`
3. ✅ Trên VPS: Chạy `./deploy.sh`

## 🔍 Kiểm tra nhanh

Sau khi upload code, trên VPS kiểm tra:

```bash
# Xem cấu trúc thư mục
ls -la /root/tempmail/

# Xem các scripts
ls -la /root/tempmail/*.sh

# Đảm bảo scripts có quyền thực thi
chmod +x /root/tempmail/*.sh
```

## ⚠️ Lưu ý

- **Credentials file** (`~/.cloudflared/*.json`) chứa thông tin nhạy cảm, cần bảo mật
- **Environment files** (`.env`) không nên commit lên Git
- **Test local** trước khi deploy để tránh lỗi trên VPS
- **Backup** credentials file trước khi xóa
