# 📧 Tempmail Backend API Documentation

## 🔗 Base URL
```
http://localhost:3001
```

**Production:** Update to your deployed backend URL

---

## 📡 API Endpoints

### 1. Health Check
Check if the backend server is running.

**Endpoint:** `GET /health`

**Response:**
```typescript
{
  status: "ok",
  timestamp: string // ISO 8601 format
}
```

**Example:**
```typescript
const response = await fetch('http://localhost:3001/health');
const data = await response.json();
// { status: "ok", timestamp: "2026-01-22T06:50:00.000Z" }
```

---

### 2. Get Emails for Address
Fetch all emails for a specific email address from the last 10 minutes.

**Endpoint:** `GET /api/emails?address={email}`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | ✅ Yes | Email address ending with `@iceteadev.site` |

**Response:**
```typescript
{
  success: boolean;
  emailAddress: string;
  count: number;
  emails: Array<{
    id: string;
    from: string;
    subject: string;
    date: string; // ISO 8601 format
    preview: string; // First 150 characters of email body
  }>;
}
```

**Example Request:**
```typescript
const emailAddress = 'tuan1@iceteadev.site';
const response = await fetch(
  `http://localhost:3001/api/emails?address=${encodeURIComponent(emailAddress)}`
);
const data = await response.json();

// Response:
// {
//   "success": true,
//   "emailAddress": "tuan1@iceteadev.site",
//   "count": 2,
//   "emails": [
//     {
//       "id": "23157",
//       "from": "noreply@example.com",
//       "subject": "Welcome!",
//       "date": "2026-01-22T06:31:00.000Z",
//       "preview": "Welcome to our service..."
//     }
//   ]
// }
```

**Error Responses:**

**400 Bad Request** - Invalid or missing email address:
```json
{
  "error": "Missing or invalid email address parameter",
  "message": "Please provide a valid email address with ?address=xxx@iceteadev.site"
}
```

**400 Bad Request** - Email domain not allowed:
```json
{
  "error": "Invalid email address",
  "message": "Email must end with @iceteadev.site"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch emails"
}
```

---

### 3. Get Email by ID
Get full email details including HTML and text body.

**Endpoint:** `GET /api/emails/:id?address={email}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ Yes | Email ID (from the emails list) |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | ✅ Yes | Email address ending with `@iceteadev.site` |

**Response:**
```typescript
{
  success: boolean;
  email: {
    id: string;
    from: string;
    to: string;
    subject: string;
    date: string; // ISO 8601 format
    textBody: string; // Plain text version
    htmlBody: string; // HTML version
  };
}
```

**Example Request:**
```typescript
const emailId = '23157';
const emailAddress = 'tuan1@iceteadev.site';
const response = await fetch(
  `http://localhost:3001/api/emails/${emailId}?address=${encodeURIComponent(emailAddress)}`
);
const data = await response.json();

// Response:
// {
//   "success": true,
//   "email": {
//     "id": "23157",
//     "from": "noreply@example.com",
//     "to": "tuan1@iceteadev.site",
//     "subject": "Welcome!",
//     "date": "2026-01-22T06:31:00.000Z",
//     "textBody": "Welcome to our service...",
//     "htmlBody": "<html><body>Welcome...</body></html>"
//   }
// }
```

**Error Responses:**

**400 Bad Request** - Missing email address:
```json
{
  "error": "Missing email address parameter"
}
```

**404 Not Found** - Email not found:
```json
{
  "error": "Email not found",
  "message": "No email found with the specified ID for this address"
}
```

---

### 4. Refresh Emails (Clear Cache)
Force refresh and re-fetch emails from the server, bypassing the 10-minute cache.

**Endpoint:** `POST /api/refresh?address={email}`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | ✅ Yes | Email address ending with `@iceteadev.site` |

**Response:**
```typescript
{
  success: boolean;
  message: string;
  count: number; // Number of emails found
}
```

**Example Request:**
```typescript
const emailAddress = 'tuan1@iceteadev.site';
const response = await fetch(
  `http://localhost:3001/api/refresh?address=${encodeURIComponent(emailAddress)}`,
  { method: 'POST' }
);
const data = await response.json();

// Response:
// {
//   "success": true,
//   "message": "Emails refreshed successfully",
//   "count": 2
// }
```

---

## 🔒 CORS Configuration

CORS is **enabled** for all origins in development. No special headers required.

---

## ⚙️ Configuration

### Email Fetch Window
The backend fetches emails from the **last 10 minutes** by default.

To change this, update `EMAIL_FETCH_MINUTES` in the backend `.env` file.

### Caching
- Emails are cached for **10 minutes** per email address
- Use the `/api/refresh` endpoint to force a cache clear and re-fetch

### Allowed Domain
Only emails ending with `@iceteadev.site` are accepted.

---

## 📦 TypeScript Types

```typescript
// Email preview (list view)
interface EmailPreview {
  id: string;
  from: string;
  subject: string;
  date: string; // ISO 8601
  preview: string;
}

// Full email details
interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string; // ISO 8601
  textBody: string;
  htmlBody: string;
}

// Get emails response
interface GetEmailsResponse {
  success: boolean;
  emailAddress: string;
  count: number;
  emails: EmailPreview[];
}

// Get email by ID response
interface GetEmailResponse {
  success: boolean;
  email: Email;
}

// Refresh response
interface RefreshResponse {
  success: boolean;
  message: string;
  count: number;
}

// Error response
interface ErrorResponse {
  error: string;
  message?: string;
}
```

---

## 🧪 Example Frontend Integration

### React Example with TypeScript

```typescript
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

function EmailInbox() {
  const [emails, setEmails] = useState<EmailPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const emailAddress = 'tuan1@iceteadev.site';

  // Fetch emails
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/emails?address=${encodeURIComponent(emailAddress)}`
      );
      
      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.message || error.error);
      }

      const data: GetEmailsResponse = await response.json();
      setEmails(data.emails);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh emails
  const refreshEmails = async () => {
    setLoading(true);
    try {
      await fetch(
        `${API_BASE}/api/refresh?address=${encodeURIComponent(emailAddress)}`,
        { method: 'POST' }
      );
      
      // Fetch updated emails
      await fetchEmails();
    } catch (error) {
      console.error('Failed to refresh emails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div>
      <button onClick={refreshEmails} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      
      <div>
        {emails.map(email => (
          <div key={email.id}>
            <h3>{email.subject}</h3>
            <p>From: {email.from}</p>
            <p>{email.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Fetch API Helper

```typescript
class EmailAPI {
  private baseURL: string;

  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async getEmails(address: string): Promise<GetEmailsResponse> {
    const response = await fetch(
      `${this.baseURL}/api/emails?address=${encodeURIComponent(address)}`
    );
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || error.error);
    }
    
    return response.json();
  }

  async getEmailById(id: string, address: string): Promise<GetEmailResponse> {
    const response = await fetch(
      `${this.baseURL}/api/emails/${id}?address=${encodeURIComponent(address)}`
    );
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || error.error);
    }
    
    return response.json();
  }

  async refreshEmails(address: string): Promise<RefreshResponse> {
    const response = await fetch(
      `${this.baseURL}/api/refresh?address=${encodeURIComponent(address)}`,
      { method: 'POST' }
    );
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || error.error);
    }
    
    return response.json();
  }
}

// Usage
const emailAPI = new EmailAPI();
const { emails } = await emailAPI.getEmails('tuan1@iceteadev.site');
```

---

## 🐛 Common Issues

### Empty emails array
**Cause:** No emails received in the last 10 minutes, or the email address hasn't received any mail.

**Solution:** 
- Send a test email to the address
- Use the refresh endpoint to force a re-fetch
- Check backend logs for IMAP connection issues

### "Invalid email address" error
**Cause:** Email doesn't end with `@iceteadev.site`

**Solution:** Only use emails with the allowed domain

### CORS errors
**Cause:** Frontend and backend on different origins in production

**Solution:** Configure CORS properly in backend production settings

---

## 📞 Support

For issues or questions, check:
- Backend logs in terminal
- `/health` endpoint to verify server status
- Ensure email forwarding is configured correctly with Cloudflare Email Routing
