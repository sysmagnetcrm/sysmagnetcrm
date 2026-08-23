/**
 * Production-Grade Secure Logger
 * Redacts sensitive credentials (tokens, passwords, JWTs, API keys)
 * before logging diagnostic data.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'jwt',
  'apikey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'service_role',
  'service_role_key',
];

/**
 * Recursively sanitize an object by masking sensitive keys
 */
const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Mask potential JWT tokens (e.g. eyJhbGciOi...)
    if (/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/.test(data)) {
      return '[REDACTED_JWT]';
    }
    return data;
  }

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeData(value);
    }
  }
  return sanitized;
};

export const logger = {
  error: (message, context = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[CRM ERROR] ${message}`, sanitizeData(context));
    }
  },
  warn: (message, context = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[CRM WARN] ${message}`, sanitizeData(context));
    }
  },
  info: (message, context = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[CRM INFO] ${message}`, sanitizeData(context));
    }
  },
};
