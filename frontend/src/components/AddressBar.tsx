'use client';

import { useState, useCallback } from 'react';
import styles from './AddressBar.module.css';

interface AddressBarProps {
  onAddressSet: (address: string) => void;
  currentAddress: string;
}

const DOMAIN = 'khoahoctietkiem.site';

function generateRandomName(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8 + Math.floor(Math.random() * 5);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AddressBar({ onAddressSet, currentAddress }: AddressBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = useCallback(() => {
    const name = inputValue.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (name) {
      onAddressSet(`${name}@${DOMAIN}`);
      setInputValue('');
    }
  }, [inputValue, onAddressSet]);

  const handleGenerate = useCallback(() => {
    const randomName = generateRandomName();
    const address = `${randomName}@${DOMAIN}`;
    onAddressSet(address);
    setInputValue('');
  }, [onAddressSet]);

  const handleCopy = useCallback(async () => {
    if (currentAddress) {
      try {
        await navigator.clipboard.writeText(currentAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = currentAddress;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [currentAddress]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <div className={styles.inputWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            id="email-input"
            type="text"
            className={styles.input}
            placeholder="Nhập tên email hoặc nhấn tạo ngẫu nhiên..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.domain}>@{DOMAIN}</span>
        </div>

        <div className={styles.actions}>
          <button
            id="btn-use-email"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Sử dụng
          </button>
          <button
            id="btn-generate"
            className={styles.btnSecondary}
            onClick={handleGenerate}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Tạo ngẫu nhiên
          </button>
        </div>
      </div>

      {currentAddress && (
        <div className={styles.activeAddress}>
          <div className={styles.activeLabel}>
            <span className={styles.activeDot} />
            Email đang sử dụng
          </div>
          <div className={styles.addressDisplay}>
            <span className={styles.addressText}>{currentAddress}</span>
            <button
              id="btn-copy"
              className={`${styles.btnCopy} ${copied ? styles.btnCopied : ''}`}
              onClick={handleCopy}
              title="Copy email"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Đã copy
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
