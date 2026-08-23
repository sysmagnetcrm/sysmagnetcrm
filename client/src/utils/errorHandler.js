import { logger } from './logger';

/**
 * Generate short, unique, non-sensitive support reference ID
 * Example: ERN-8F42KD
 */
export const generateReferenceId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'ERN-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

/**
 * Application Error Categories
 */
export const ERROR_CATEGORIES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  EDGE_FUNCTION_ERROR: 'EDGE_FUNCTION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Centralized Error Normalizer
 * Sanitizes raw backend/database exceptions and maps them to safe user-facing messages.
 */
export const normalizeError = (rawError, context = {}) => {
  const referenceId = generateReferenceId();
  const rawMsg = String(rawError?.message || rawError?.error_description || rawError?.details || rawError || '').toLowerCase();
  const rawCode = String(rawError?.code || rawError?.statusCode || '').toUpperCase();

  // Log diagnostic securely (with redacted credentials)
  logger.error('Error Intercepted', {
    referenceId,
    context,
    rawCode,
    rawMsgSnippet: rawMsg.slice(0, 120),
  });

  // Default Fallback Application Error
  let normalized = {
    code: context.code || 'ACTION_FAILED',
    category: ERROR_CATEGORIES.UNKNOWN_ERROR,
    userMessage: 'We couldn\'t complete this action right now.',
    actionMessage: 'Please try again. If the problem continues, contact support.',
    retryable: true,
    referenceId,
  };

  // 1. Network & Offline Failures
  if (rawMsg.includes('network') || rawMsg.includes('fetch failed') || rawMsg.includes('failed to fetch') || rawMsg.includes('econnrefused') || !navigator.onLine) {
    return {
      code: 'NETWORK_ERROR',
      category: ERROR_CATEGORIES.NETWORK_ERROR,
      userMessage: 'Connection problem.',
      actionMessage: 'We couldn\'t reach Eron-CRM services. Check your internet connection and try again.',
      retryable: true,
      referenceId,
    };
  }

  // 2. Timeout Failures
  if (rawMsg.includes('timeout') || rawMsg.includes('timed out') || rawCode === 'ECONNABORTED') {
    return {
      code: 'REQUEST_TIMEOUT',
      category: ERROR_CATEGORIES.TIMEOUT_ERROR,
      userMessage: 'Request timed out.',
      actionMessage: 'Loading is taking longer than expected. Please try again.',
      retryable: true,
      referenceId,
    };
  }

  // 3. Authentication & Session Expired
  if (rawMsg.includes('jwt expired') || rawMsg.includes('invalid claim') || rawMsg.includes('session expired') || rawMsg.includes('refresh_token_not_found') || rawCode === 'PGRST301' || rawCode === '401') {
    return {
      code: 'AUTH_SESSION_EXPIRED',
      category: ERROR_CATEGORIES.AUTHENTICATION_ERROR,
      userMessage: 'Your session has expired.',
      actionMessage: 'Please sign in again to continue.',
      retryable: false,
      referenceId,
    };
  }

  // 4. Invalid Login Credentials
  if (rawMsg.includes('invalid login credentials') || rawMsg.includes('invalid credentials') || rawMsg.includes('user not found')) {
    return {
      code: 'AUTH_LOGIN_FAILED',
      category: ERROR_CATEGORIES.AUTHENTICATION_ERROR,
      userMessage: 'Incorrect email or password.',
      actionMessage: 'Please check your login details and try again.',
      retryable: true,
      referenceId,
    };
  }

  // 5. RLS / Authorization Permission Failures
  if (rawMsg.includes('permission denied') || rawMsg.includes('rls') || rawCode === '42501' || rawCode === '403') {
    return {
      code: 'AUTHORIZATION_DENIED',
      category: ERROR_CATEGORIES.AUTHORIZATION_ERROR,
      userMessage: 'Access restricted.',
      actionMessage: 'You don\'t have permission to perform this action.',
      retryable: false,
      referenceId,
    };
  }

  // 6. Record Not Found (PGRST116)
  if (rawMsg.includes('pgrst116') || rawMsg.includes('not found') || rawCode === 'PGRST116' || rawCode === '404') {
    return {
      code: 'RECORD_NOT_FOUND',
      category: ERROR_CATEGORIES.NOT_FOUND_ERROR,
      userMessage: 'Resource not found.',
      actionMessage: 'The requested record could not be found or is no longer available.',
      retryable: false,
      referenceId,
    };
  }

  // 7. Duplicate Constraint Violation (23505)
  if (rawMsg.includes('unique constraint') || rawMsg.includes('already exists') || rawCode === '23505' || rawCode === '409') {
    return {
      code: 'RECORD_ALREADY_EXISTS',
      category: ERROR_CATEGORIES.CONFLICT_ERROR,
      userMessage: 'Record already exists.',
      actionMessage: 'This information has already been recorded. Please check existing entries.',
      retryable: false,
      referenceId,
    };
  }

  // 8. Foreign Key Violation (23503)
  if (rawMsg.includes('foreign key constraint') || rawCode === '23503') {
    return {
      code: 'RECORD_DEPENDENCY_ERROR',
      category: ERROR_CATEGORIES.CONFLICT_ERROR,
      userMessage: 'Action restricted.',
      actionMessage: 'This record cannot be removed or updated because it is being used elsewhere.',
      retryable: false,
      referenceId,
    };
  }

  // 9. Storage / Upload Errors
  if (rawMsg.includes('storage') || rawMsg.includes('upload') || context.module === 'storage') {
    return {
      code: 'FILE_UPLOAD_FAILED',
      category: ERROR_CATEGORIES.STORAGE_ERROR,
      userMessage: 'File action failed.',
      actionMessage: 'We couldn\'t process this file. Check the file size and format, then try again.',
      retryable: true,
      referenceId,
    };
  }

  // 10. Known Safe Business Messages
  if (rawError?.userMessage) {
    return {
      ...normalized,
      userMessage: rawError.userMessage,
      actionMessage: rawError.actionMessage || normalized.actionMessage,
    };
  }

  return normalized;
};
