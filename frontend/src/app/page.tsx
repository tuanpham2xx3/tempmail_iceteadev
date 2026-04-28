'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { emailAPI, EmailPreview, EmailFull } from '@/lib/api';
import AddressBar from '@/components/AddressBar';
import EmailList from '@/components/EmailList';
import EmailViewer from '@/components/EmailViewer';
import styles from './page.module.css';

const AUTO_REFRESH_INTERVAL = 15; // seconds

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [emails, setEmails] = useState<EmailPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'viewer'>('list');
  const countdownRef = useRef(AUTO_REFRESH_INTERVAL);

  // Fetch emails for address
  const fetchEmails = useCallback(async (addr: string, isRefresh = false) => {
    if (!addr) return;
    try {
      if (isRefresh) {
        setRefreshing(true);
        await emailAPI.refreshEmails(addr);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await emailAPI.getEmails(addr);
      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải email');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(AUTO_REFRESH_INTERVAL);
      countdownRef.current = AUTO_REFRESH_INTERVAL;
    }
  }, []);

  // Fetch single email
  const fetchEmail = useCallback(async (id: string) => {
    if (!address) return;
    setEmailLoading(true);
    try {
      const data = await emailAPI.getEmailById(id, address);
      setSelectedEmail(data.email);
    } catch {
      setSelectedEmail(null);
    } finally {
      setEmailLoading(false);
    }
  }, [address]);

  // Handle address set
  const handleAddressSet = useCallback((addr: string) => {
    setAddress(addr);
    setSelectedId(null);
    setSelectedEmail(null);
    setEmails([]);
    setMobileView('list');
    fetchEmails(addr);
  }, [fetchEmails]);

  // Handle email select
  const handleSelectEmail = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView('viewer');
    fetchEmail(id);
  }, [fetchEmail]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (address) fetchEmails(address, true);
  }, [address, fetchEmails]);

  // Handle close viewer (mobile)
  const handleCloseViewer = useCallback(() => {
    setSelectedId(null);
    setSelectedEmail(null);
    setMobileView('list');
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        countdownRef.current = AUTO_REFRESH_INTERVAL;
        setCountdown(AUTO_REFRESH_INTERVAL);
        fetchEmails(address);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [address, fetchEmails]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <h1 className={styles.brandName}>TempMail</h1>
              <p className={styles.brandTag}>Email tạm thời miễn phí</p>
            </div>
          </div>
        </div>
      </header>

      {/* Address Bar */}
      <section className={styles.addressSection}>
        <div className={styles.addressContent}>
          <AddressBar onAddressSet={handleAddressSet} currentAddress={address} />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Main Content */}
      {address && (
        <main className={styles.main}>
          <div className={styles.mainContent}>
            <div className={`${styles.sidebar} ${mobileView === 'viewer' ? styles.hideMobile : ''}`}>
              <EmailList
                emails={emails}
                selectedId={selectedId}
                onSelect={handleSelectEmail}
                loading={loading}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                autoRefreshCountdown={countdown}
              />
            </div>
            <div className={`${styles.viewer} ${mobileView === 'list' ? styles.hideMobile : ''}`}>
              <EmailViewer
                email={selectedEmail}
                loading={emailLoading}
                onClose={handleCloseViewer}
              />
            </div>
          </div>
        </main>
      )}

      {/* Landing section when no address */}
      {!address && (
        <section className={styles.landing}>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Nhanh chóng</h3>
              <p>Tạo email tạm thời ngay lập tức, không cần đăng ký</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Riêng tư</h3>
              <p>Email tự động xóa sau 10 phút, bảo vệ quyền riêng tư</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔄</div>
              <h3>Tự động làm mới</h3>
              <p>Email mới tự động cập nhật mỗi 15 giây</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
