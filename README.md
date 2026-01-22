# Temporary Email Website

Dịch vụ email tạm thời sử dụng Cloudflare Email Routing và Gmail IMAP.

## 🏗️ Kiến trúc

- **Frontend**: Next.js 15 + TypeScript + Vanilla CSS
- **Backend**: Node.js + Express + IMAP
- **Email**: Cloudflare Email Routing (`*@iceteadev.site` → Gmail)

## 📁 Cấu trúc Project

```
tempmail/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config.ts       # Environment configuration
│   │   ├── index.ts        # Express server
│   │   ├── routes/
│   │   │   └── emailRoutes.ts
│   │   └── services/
│   │       └── imapService.ts
│   ├── .env                # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # Next.js application
    ├── app/
    │   ├── layout.tsx      # Root layout
    │   ├── page.tsx        # Main page
    │   ├── globals.css     # Global styles
    │   └── page.module.css
    ├── components/
    │   ├── EmailList.tsx
    │   └── EmailViewer.tsx
    ├── lib/
    │   └── api.ts          # API client
    └── package.json
```

## 🚀 Cài đặt & Chạy

### Backend

```bash
cd backend
npm install
npm run dev
```

Server chạy tại: `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App chạy tại: `http://localhost:3000`

## ⚙️ Cấu hình Cloudflare Email Routing

1. Truy cập Cloudflare Dashboard → Domain `iceteadev.site`
2. Vào **Email** → **Email Routing**
3. Bật Email Routing
4. Thêm destination address: `phamtuan2xx3@gmail.com`
5. Tạo catch-all rule: `*@iceteadev.site` → `phamtuan2xx3@gmail.com`

## 🔑 Environment Variables

Backend `.env`:
```
GMAIL_EMAIL=phamtuan2xx3@gmail.com
GMAIL_APP_PASSWORD=elxkvsccnufclkfb
PORT=3001
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
ALLOWED_DOMAIN=iceteadev.site
EMAIL_FETCH_MINUTES=10
```

## 📡 API Endpoints

- `GET /api/emails?address=<email>` - Lấy danh sách emails
- `GET /api/emails/:id?address=<email>` - Lấy chi tiết email
- `POST /api/refresh?address=<email>` - Làm mới emails
- `GET /health` - Health check

## 🎨 Features

- ✅ Nhập bất kỳ email `@iceteadev.site` nào
- ✅ Hiển thị emails trong 10 phút gần đây
- ✅ Tự động làm mới mỗi 15 giây
- ✅ Xem nội dung email (HTML/text)
- ✅ Copy địa chỉ email
- ✅ Responsive design
- ✅ Dark theme với glassmorphism

## 🔐 Bảo mật

- Chỉ chấp nhận email domain `@iceteadev.site`
- IMAP sử dụng SSL/TLS
- CORS được cấu hình cho frontend

## 📝 License

MIT
