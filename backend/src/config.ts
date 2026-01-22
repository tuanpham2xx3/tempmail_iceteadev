import dotenv from 'dotenv';

dotenv.config();

export const config = {
    gmail: {
        email: process.env.GMAIL_EMAIL || '',
        appPassword: process.env.GMAIL_APP_PASSWORD || '',
    },
    imap: {
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993', 10),
    },
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
    },
    email: {
        allowedDomain: process.env.ALLOWED_DOMAIN || 'iceteadev.site',
        fetchMinutes: parseInt(process.env.EMAIL_FETCH_MINUTES || '10', 10),
    },
};

// Validate required config
if (!config.gmail.email || !config.gmail.appPassword) {
    throw new Error('Missing required environment variables: GMAIL_EMAIL and GMAIL_APP_PASSWORD');
}
