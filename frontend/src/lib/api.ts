// API client for Tempmail backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface EmailPreview {
  id: string;
  from: string;
  subject: string;
  date: string;
  preview: string;
}

export interface EmailFull {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  textBody: string;
  htmlBody: string;
}

export interface GetEmailsResponse {
  success: boolean;
  emailAddress: string;
  count: number;
  emails: EmailPreview[];
}

export interface GetEmailResponse {
  success: boolean;
  email: EmailFull;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  count: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

class EmailAPI {
  private baseURL: string;

  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  async getEmails(address: string): Promise<GetEmailsResponse> {
    const response = await fetch(
      `${this.baseURL}/emails?address=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || error.error);
    }

    return response.json();
  }

  async getEmailById(id: string, address: string): Promise<GetEmailResponse> {
    const response = await fetch(
      `${this.baseURL}/emails/${id}?address=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || error.error);
    }

    return response.json();
  }

  async refreshEmails(address: string): Promise<RefreshResponse> {
    const response = await fetch(
      `${this.baseURL}/refresh?address=${encodeURIComponent(address)}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || error.error);
    }

    return response.json();
  }
}

export const emailAPI = new EmailAPI();
