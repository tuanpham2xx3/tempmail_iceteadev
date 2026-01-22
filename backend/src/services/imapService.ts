import imapSimple, { ImapSimple, Message } from 'imap-simple';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { config } from '../config';

interface EmailData {
    id: string;
    from: string;
    to: string;
    subject: string;
    date: Date;
    textBody: string;
    htmlBody: string;
    originalRecipient: string;
}

interface EmailCache {
    [emailAddress: string]: {
        emails: EmailData[];
        timestamp: number;
    };
}

const emailCache: EmailCache = {};
const CACHE_TTL = config.email.fetchMinutes * 60 * 1000; // 10 minutes in milliseconds

/**
 * Connect to Gmail IMAP server
 */
async function connectToImap(): Promise<ImapSimple> {
    const imapConfig = {
        imap: {
            user: config.gmail.email,
            password: config.gmail.appPassword,
            host: config.imap.host,
            port: config.imap.port,
            tls: true,
            authTimeout: 10000,
            tlsOptions: {
                rejectUnauthorized: false, // Allow self-signed certificates (for development)
            },
        },
    };

    try {
        const connection = await imapSimple.connect(imapConfig);
        console.log('✅ Connected to Gmail IMAP');
        return connection;
    } catch (error) {
        console.error('❌ IMAP connection failed:', error);
        throw new Error('Failed to connect to IMAP server');
    }
}

/**
 * Extract email address from AddressObject
 */
function extractEmailAddress(addressObj: AddressObject | AddressObject[] | undefined): string {
    if (!addressObj) return '';

    const addresses = Array.isArray(addressObj) ? addressObj : [addressObj];
    if (addresses.length > 0 && addresses[0].value && addresses[0].value.length > 0) {
        return addresses[0].value[0].address || '';
    }
    return '';
}

/**
 * Extract original recipient from email headers
 * Cloudflare Email Routing adds forwarding information in headers
 */
function extractOriginalRecipient(parsed: ParsedMail): string {
    const headers = parsed.headers;

    // Cloudflare Email Routing specific headers
    // X-Forwarded-For contains: "original@domain.com final@gmail.com"
    const xForwardedFor = headers.get('x-forwarded-for') as string;
    if (xForwardedFor) {
        // X-Forwarded-For can contain multiple addresses separated by spaces
        const addresses = xForwardedFor.split(/\s+/);
        for (const addr of addresses) {
            const match = addr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (match && match[1].endsWith(`@${config.email.allowedDomain}`)) {
                return match[1].toLowerCase();
            }
        }
    }

    // Check other header fields for the original recipient
    const deliveredTo = headers.get('delivered-to') as string;
    const xForwardedTo = headers.get('x-forwarded-to') as string;
    const xOriginalTo = headers.get('x-original-to') as string;
    const to = headers.get('to') as string;

    // Try to find an @iceteadev.site address
    const candidates = [deliveredTo, xForwardedTo, xOriginalTo, to].filter(Boolean);

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.includes(`@${config.email.allowedDomain}`)) {
            // Extract email from potential format like "Name <email@domain.com>"
            const match = candidate.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (match && match[1].endsWith(`@${config.email.allowedDomain}`)) {
                return match[1].toLowerCase();
            }
        }
    }

    // Fallback to parsed 'to' field
    const toEmail = extractEmailAddress(parsed.to);
    return toEmail.toLowerCase();
}

/**
 * Parse raw IMAP message to EmailData
 */
async function parseEmailMessage(message: Message): Promise<EmailData | null> {
    try {
        const part = message.parts.find((p) => p.which === '');
        if (!part || !part.body) return null;

        const parsed = await simpleParser(part.body);

        const fromEmail = extractEmailAddress(parsed.from);
        const toEmail = extractEmailAddress(parsed.to);
        const originalRecipient = extractOriginalRecipient(parsed);

        return {
            id: message.attributes.uid.toString(),
            from: fromEmail,
            to: toEmail,
            subject: parsed.subject || '(No Subject)',
            date: parsed.date || new Date(),
            textBody: parsed.text || '',
            htmlBody: parsed.html || '',
            originalRecipient,
        };
    } catch (error) {
        console.error('Error parsing email:', error);
        return null;
    }
}

/**
 * Fetch emails from the last N minutes
 */
export async function fetchRecentEmails(sinceMinutes: number = config.email.fetchMinutes): Promise<EmailData[]> {
    let connection: ImapSimple | null = null;

    try {
        connection = await connectToImap();
        await connection.openBox('INBOX');

        // Calculate date for IMAP SINCE search (emails since N minutes ago)
        const sinceDate = new Date();
        sinceDate.setMinutes(sinceDate.getMinutes() - sinceMinutes);

        // IMAP SINCE format: DD-MMM-YYYY (e.g., "22-Jan-2026")
        const sinceDateStr = sinceDate.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).replace(/\//g, '-');

        const searchCriteria = [['SINCE', sinceDateStr]];
        const fetchOptions = {
            bodies: [''],
            markSeen: false,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📧 Fetched ${messages.length} emails from last ${sinceMinutes} minutes`);

        const emails: EmailData[] = [];
        for (const message of messages) {
            const emailData = await parseEmailMessage(message);
            if (emailData) {
                emails.push(emailData);
            }
        }

        return emails;
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

/**
 * Fetch emails for a specific email address with caching
 */
export async function fetchEmailsForAddress(emailAddress: string): Promise<EmailData[]> {
    const lowercaseEmail = emailAddress.toLowerCase();

    // Check cache first
    const cached = emailCache[lowercaseEmail];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`💾 Cache hit for ${lowercaseEmail}`);
        return cached.emails;
    }

    console.log(`🔍 Fetching emails for ${lowercaseEmail}...`);

    // Fetch recent emails
    const allEmails = await fetchRecentEmails();

    // Filter by original recipient
    const filteredEmails = allEmails.filter(
        (email) => email.originalRecipient === lowercaseEmail
    );

    // Update cache
    emailCache[lowercaseEmail] = {
        emails: filteredEmails,
        timestamp: Date.now(),
    };

    console.log(`✅ Found ${filteredEmails.length} emails for ${lowercaseEmail}`);
    return filteredEmails;
}

/**
 * Clear cache for a specific email address
 */
export function clearCacheForAddress(emailAddress: string): void {
    const lowercaseEmail = emailAddress.toLowerCase();
    delete emailCache[lowercaseEmail];
    console.log(`🗑️ Cache cleared for ${lowercaseEmail}`);
}
