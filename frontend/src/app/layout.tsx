import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TempMail - Email Tạm Thời | khoahoctietkiem.site',
  description: 'Dịch vụ email tạm thời miễn phí. Nhận email xác minh nhanh chóng với @khoahoctietkiem.site. Bảo vệ quyền riêng tư của bạn.',
  keywords: ['tempmail', 'email tạm thời', 'temporary email', 'disposable email', 'khoahoctietkiem'],
  openGraph: {
    title: 'TempMail - Email Tạm Thời',
    description: 'Dịch vụ email tạm thời miễn phí với @khoahoctietkiem.site',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
