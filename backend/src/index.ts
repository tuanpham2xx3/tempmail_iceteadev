import express from 'express';
import cors from 'cors';
import { config } from './config';
import emailRoutes from './routes/emailRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', emailRoutes);

// Static frontend
app.use(express.static('public'));

// Fallback all non-API routes to index.html (SPA routing)
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    res.sendFile('index.html', { root: 'public' });
});

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
// Bind to localhost only (127.0.0.1) for VPS sandbox compatibility
// Cloudflare Tunnel will route traffic to localhost
const host = process.env.HOST || '127.0.0.1';
app.listen(config.server.port, host, () => {
    console.log(`\n🚀 Tempmail Backend Server`);
    console.log(`📧 Gmail: ${config.gmail.email}`);
    console.log(`🌐 Domain: @${config.email.allowedDomain}`);
    console.log(`⏱️  Fetch window: ${config.email.fetchMinutes} minutes`);
    console.log(`🔌 Server running on http://${host}:${config.server.port}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   GET  /api/emails?address=<email>`);
    console.log(`   GET  /api/emails/:id?address=<email>`);
    console.log(`   POST /api/refresh?address=<email>`);
    console.log(`   GET  /health\n`);
});
