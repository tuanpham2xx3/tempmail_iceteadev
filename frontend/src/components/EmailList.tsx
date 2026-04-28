'use client';

import { EmailPreview } from '@/lib/api';
import styles from './EmailList.module.css';

interface EmailListProps {
  emails: EmailPreview[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  autoRefreshCountdown: number;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getInitial(email: string): string {
  if (!email) return '?';
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase();
}

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

export default function EmailList({ 
  emails, 
  selectedId, 
  onSelect, 
  loading, 
  onRefresh, 
  refreshing, 
  autoRefreshCountdown 
}: EmailListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Hộp thư đến</h2>
          <span className={styles.count}>{emails.length}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.countdown} title="Tự động làm mới">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {autoRefreshCountdown}s
          </span>
          <button
            id="btn-refresh"
            className={`${styles.btnRefresh} ${refreshing ? styles.spinning : ''}`}
            onClick={onRefresh}
            disabled={refreshing}
            title="Làm mới"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '80%' }} />
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
              </div>
            </div>
          ))
        ) : emails.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <p className={styles.emptyTitle}>Chưa có email nào</p>
            <p className={styles.emptyDesc}>
              Email mới sẽ tự động xuất hiện ở đây
            </p>
          </div>
        ) : (
          emails.map((email, index) => (
            <button
              key={email.id}
              id={`email-item-${email.id}`}
              className={`${styles.item} ${selectedId === email.id ? styles.itemSelected : ''}`}
              onClick={() => onSelect(email.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div 
                className={styles.avatar}
                style={{ background: getAvatarColor(email.from) }}
              >
                {getInitial(email.from)}
              </div>
              <div className={styles.content}>
                <div className={styles.meta}>
                  <span className={styles.from}>{email.from || 'Unknown'}</span>
                  <span className={styles.time}>{formatTime(email.date)}</span>
                </div>
                <div className={styles.subject}>{email.subject || '(Không có tiêu đề)'}</div>
                <div className={styles.preview}>{email.preview}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
