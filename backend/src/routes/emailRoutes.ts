import { Router, Request, Response } from 'express';
import { fetchEmailsForAddress, clearCacheForAddress } from '../services/imapService';
import { config } from '../config';

const router = Router();

/**
 * Validate email address format
 */
function validateEmailAddress(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/;
    if (!emailRegex.test(email)) return false;

    return email.toLowerCase().endsWith(`@${config.email.allowedDomain}`);
}

/**
 * GET /api/emails?address=<email>
 * Fetch emails for a specific email address
 */
router.get('/emails', async (req: Request, res: Response) => {
    try {
        const { address } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Missing or invalid email address parameter',
                message: 'Please provide a valid email address with ?address=xxx@iceteadev.site',
            });
        }

        if (!validateEmailAddress(address)) {
            return res.status(400).json({
                error: 'Invalid email address',
                message: `Email must end with @${config.email.allowedDomain}`,
            });
        }

        const emails = await fetchEmailsForAddress(address);

        return res.json({
            success: true,
            emailAddress: address,
            count: emails.length,
            emails: emails.map((email) => ({
                id: email.id,
                from: email.from,
                subject: email.subject,
                date: email.date,
                preview: email.textBody.substring(0, 150) + (email.textBody.length > 150 ? '...' : ''),
            })),
        });
    } catch (error) {
        console.error('Error in GET /api/emails:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch emails',
        });
    }
});

/**
 * GET /api/emails/:id?address=<email>
 * Get full email details by ID
 */
router.get('/emails/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { address } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Missing email address parameter',
            });
        }

        if (!validateEmailAddress(address)) {
            return res.status(400).json({
                error: 'Invalid email address',
            });
        }

        const emails = await fetchEmailsForAddress(address);
        const email = emails.find((e) => e.id === id);

        if (!email) {
            return res.status(404).json({
                error: 'Email not found',
                message: 'No email found with the specified ID for this address',
            });
        }

        return res.json({
            success: true,
            email: {
                id: email.id,
                from: email.from,
                to: email.to,
                subject: email.subject,
                date: email.date,
                textBody: email.textBody,
                htmlBody: email.htmlBody,
            },
        });
    } catch (error) {
        console.error('Error in GET /api/emails/:id:', error);
        return res.status(500).json({
            error: 'Internal server error',
        });
    }
});

/**
 * POST /api/refresh?address=<email>
 * Force refresh emails for an address (clears cache)
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { address } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({
                error: 'Missing email address parameter',
            });
        }

        if (!validateEmailAddress(address)) {
            return res.status(400).json({
                error: 'Invalid email address',
            });
        }

        // Clear cache and fetch fresh emails
        clearCacheForAddress(address);
        const emails = await fetchEmailsForAddress(address);

        return res.json({
            success: true,
            message: 'Emails refreshed successfully',
            count: emails.length,
        });
    } catch (error) {
        console.error('Error in POST /api/refresh:', error);
        return res.status(500).json({
            error: 'Internal server error',
        });
    }
});

export default router;
