'use client';

import { useState } from 'react';
import { EmailFull } from '@/lib/api';
import styles from './EmailViewer.module.css';

interface EmailViewerProps {
  email: EmailFull | null;
  loading: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmailViewer({ email, loading, onClose }: EmailViewerProps) {
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Đang tải email...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h3>Chọn một email để xem</h3>
          <p>Chọn email từ danh sách bên trái để xem nội dung</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'html' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('html')}
          >
            HTML
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'text' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('text')}
          >
            Text
          </button>
        </div>
      </div>

      <div className={styles.emailHeader}>
        <h1 className={styles.subject}>{email.subject || '(Không có tiêu đề)'}</h1>
        <div className={styles.metaGrid}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Từ</span>
            <span className={styles.metaValue}>{email.from}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Đến</span>
            <span className={styles.metaValue}>{email.to}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Ngày</span>
            <span className={styles.metaValue}>{formatDate(email.date)}</span>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {viewMode === 'html' && email.htmlBody ? (
          <iframe
            className={styles.iframe}
            srcDoc={`
              <!DOCTYPE html>
              <html><head>
              <meta charset="utf-8">
              <style>
                body { 
                  font-family: 'Inter', -apple-system, sans-serif; 
                  color: #e0e0e8; 
                  background: #12121e; 
                  padding: 16px; 
                  margin: 0;
                  line-height: 1.6;
                  font-size: 14px;
                }
                a { color: #818cf8; }
                img { max-width: 100%; height: auto; }
                table { max-width: 100%; }
              </style>
              </head><body>${email.htmlBody}</body></html>
            `}
            sandbox="allow-same-origin"
            title="Email content"
          />
        ) : (
          <pre className={styles.textBody}>{email.textBody || 'Không có nội dung'}</pre>
        )}
      </div>
    </div>
  );
}
