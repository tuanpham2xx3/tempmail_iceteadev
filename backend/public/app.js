const API_BASE = '/api';
let currentAddress = localStorage.getItem('tempmail_address') || '';
let emails = [];
let countdown = 15;
let refreshInterval;
let countdownInterval;

// Elements
const elInput = document.getElementById('email-input');
const elCopyToast = document.getElementById('copy-toast');
const elEmailCount = document.getElementById('email-count');
const elCountdown = document.getElementById('countdown');
const elEmailList = document.getElementById('email-list');
const elRefreshBtn = document.getElementById('refresh-btn');

// Viewer Elements
const elViewerContainer = document.getElementById('viewer-container');
const elViewerPlaceholder = document.getElementById('viewer-placeholder');
const elViewerLoading = document.getElementById('viewer-loading');
const elViewerActive = document.getElementById('viewer-active');
const elViewerSubject = document.getElementById('viewer-subject');
const elViewerAvatar = document.getElementById('viewer-avatar');
const elViewerFromName = document.getElementById('viewer-from-name');
const elViewerFromEmail = document.getElementById('viewer-from-email');
const elViewerDate = document.getElementById('viewer-date');
const elViewerContentWrapper = document.getElementById('viewer-content-wrapper');
const elListView = document.getElementById('list-view');

// Format date relative
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
}

// Generate random string
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Initialize
async function init() {
    if (!currentAddress) {
        generateNewAddress();
    } else {
        elInput.value = currentAddress;
        fetchEmails();
    }
}

// Generate New Address
function generateNewAddress() {
    const domain = 'khoahoctietkiem.site'; // hardcoded or fetched from env later if needed
    const newAddress = `${generateRandomString(8)}@${domain}`;
    currentAddress = newAddress;
    localStorage.setItem('tempmail_address', newAddress);
    elInput.value = newAddress;
    
    // Reset state
    emails = [];
    renderEmailList();
    closeViewer();
    fetchEmails();
}

// Copy to clipboard
function copyEmail() {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress).then(() => {
        elCopyToast.classList.remove('hidden');
        setTimeout(() => elCopyToast.classList.add('hidden'), 2000);
    });
}

// Fetch Emails
async function fetchEmails(isManualRefresh = false) {
    if (!currentAddress) return;

    if (isManualRefresh) {
        elRefreshBtn.classList.add('animate-spin');
        try {
            await fetch(`${API_BASE}/refresh?address=${currentAddress}`, { method: 'POST' });
        } catch (e) {
            console.error('Refresh error', e);
        }
    } else if (emails.length === 0) {
        elEmailList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-10">
                <div class="spinner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-8 h-8 text-blue-500">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                </div>
                <p class="text-sm">Đang kiểm tra hộp thư...</p>
            </div>
        `;
    }

    try {
        const res = await fetch(`${API_BASE}/emails?address=${currentAddress}`);
        if (res.ok) {
            const data = await res.json();
            emails = data.emails || [];
            renderEmailList();
        }
    } catch (e) {
        console.error('Fetch emails error', e);
        if (emails.length === 0) {
            elEmailList.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-red-400 py-10 text-center px-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-8 h-8 mb-2">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p class="text-sm">Không thể kết nối đến máy chủ. Đang thử lại...</p>
                </div>
            `;
        }
    } finally {
        elRefreshBtn.classList.remove('animate-spin');
        resetCountdown();
    }
}

// Render Email List
function renderEmailList() {
    elEmailCount.textContent = emails.length;
    
    if (emails.length === 0) {
        elEmailList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-center px-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-16 h-16 mb-4 text-gray-300">
                    <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"/>
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                </svg>
                <p class="font-medium text-gray-500">Hộp thư trống</p>
                <p class="text-sm mt-1 text-gray-400">Email mới sẽ tự động hiện ở đây</p>
            </div>
        `;
        return;
    }

    elEmailList.innerHTML = emails.map(email => {
        const fromString = email.from || 'Unknown';
        const fromName = fromString.split('@')[0];
        const avatarLetter = fromName.charAt(0).toUpperCase();
        
        return `
            <button onclick="openEmail('${email.id}')" class="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors border border-transparent focus:outline-none focus:border-blue-200 group relative bg-white">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                        ${avatarLetter}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-baseline justify-between gap-2 mb-0.5">
                            <span class="font-semibold text-gray-900 truncate">${fromName}</span>
                            <span class="text-xs text-gray-500 whitespace-nowrap">${formatRelativeTime(email.date)}</span>
                        </div>
                        <h4 class="text-sm font-medium text-gray-800 truncate mb-1">${email.subject || '(Không có tiêu đề)'}</h4>
                        <p class="text-xs text-gray-500 line-clamp-1">${email.preview || '...'}</p>
                    </div>
                </div>
            </button>
        `;
    }).join('');
}

// Open Email
async function openEmail(id) {
    // UI mobile transition
    if (window.innerWidth < 768) {
        elListView.classList.add('hidden');
        elViewerContainer.classList.remove('hidden');
    }

    elViewerPlaceholder.classList.add('hidden');
    elViewerActive.classList.add('hidden');
    elViewerLoading.classList.remove('hidden');
    elViewerLoading.classList.add('flex');

    try {
        const res = await fetch(`${API_BASE}/emails/${id}?address=${currentAddress}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const email = data.email;

        // Render header
        const fromString = email.from || 'Unknown';
        const fromName = fromString.split('@')[0];
        elViewerAvatar.textContent = fromName.charAt(0).toUpperCase();
        elViewerSubject.textContent = email.subject || '(Không có tiêu đề)';
        elViewerFromName.textContent = fromName;
        elViewerFromEmail.textContent = `<${fromString}>`;
        elViewerDate.textContent = new Date(email.date).toLocaleString('vi-VN');

        // Render body using iframe for isolation
        const htmlContent = email.htmlBody || `<div style="white-space: pre-wrap; font-family: sans-serif; padding: 1rem;">${email.textBody || 'Email không có nội dung.'}</div>`;
        
        // Clean old iframe to prevent memory leak
        elViewerContentWrapper.innerHTML = '';
        
        const iframe = document.createElement('iframe');
        elViewerContentWrapper.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Fix iframe links to open in new tab
        const baseTag = doc.createElement('base');
        baseTag.target = '_blank';
        doc.head.appendChild(baseTag);

        elViewerLoading.classList.add('hidden');
        elViewerLoading.classList.remove('flex');
        elViewerActive.classList.remove('hidden');
        elViewerActive.classList.add('flex');

    } catch (e) {
        console.error('Open email error', e);
        elViewerLoading.classList.add('hidden');
        elViewerLoading.classList.remove('flex');
        elViewerPlaceholder.classList.remove('hidden');
    }
}

// Close Viewer (Mobile)
function closeViewer() {
    if (window.innerWidth < 768) {
        elListView.classList.remove('hidden');
        elViewerContainer.classList.add('hidden');
    }
    elViewerActive.classList.add('hidden');
    elViewerActive.classList.remove('flex');
    elViewerLoading.classList.add('hidden');
    elViewerLoading.classList.remove('flex');
    elViewerPlaceholder.classList.remove('hidden');
}

// Countdown Logic
function resetCountdown() {
    countdown = 15;
    elCountdown.textContent = '15s';
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        countdown--;
        elCountdown.textContent = countdown + 's';
        if (countdown <= 0) {
            fetchEmails();
        }
    }, 1000);
}

// Start
init();
