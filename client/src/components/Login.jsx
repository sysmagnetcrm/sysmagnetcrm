import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import EronInput from './EronInput';

// Helper to map technical backend errors to safe, user-friendly messages
export const mapAuthError = (error) => {
  if (!error) return '';
  const message = typeof error === 'string' ? error : error.message || '';
  const lower = message.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password') ||
    lower.includes('user not found')
  ) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email address has not been confirmed. Please check your inbox.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('connection')
  ) {
    return "We couldn't connect to the server. Please check your connection and try again.";
  }
  return 'Unable to sign in right now. Please try again or contact support.';
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Password Recovery state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(mapAuthError(result.error));
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryError('Please enter your work email address.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoverySuccess(false);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        recoveryEmail.trim(),
        { redirectTo: redirectUrl }
      );

      if (resetErr) {
        setRecoveryError(mapAuthError(resetErr));
      } else {
        setRecoverySuccess(true);
      }
    } catch (err) {
      setRecoveryError(mapAuthError(err));
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1115] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col justify-between items-center p-4 sm:p-6 font-sans transition-colors duration-200">
      <div className="w-full flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-[420px] bg-white dark:bg-[#171A21] border border-[#E2E8F0] dark:border-[#2B313C] rounded-2xl shadow-sm p-6 sm:p-8 transition-all">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#FF8A1F] text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-sm mx-auto mb-3">
              E
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#FF8A1F]">
              Eron-CRM
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mt-1">
              Welcome back
            </h1>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1] mt-1">
              Sign in to your Eron-CRM workspace.
            </p>
          </div>

          {/* Sanitized Error Alert */}
          {error && (
            <div
              className="mb-5 p-3.5 bg-[#FEF3F2] dark:bg-[#F04438]/10 border border-[#FEE4E2] dark:border-[#F04438]/20 text-[#D92D20] dark:text-[#F04438] rounded-xl text-xs font-medium flex items-center gap-2.5"
              role="alert"
            >
              <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            <EronInput
              id="email"
              name="email"
              type="email"
              label="Work Email"
              icon="heroicons:envelope"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="name@company.com"
              required
              autoComplete="email"
              disabled={loading}
            />

            <div className="space-y-1">
              <EronInput
                id="password"
                name="password"
                type="password"
                label="Password"
                icon="heroicons:lock-closed"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(email);
                    setRecoveryError('');
                    setRecoverySuccess(false);
                    setShowForgotPassword(true);
                  }}
                  className="text-xs font-semibold text-[#FF8A1F] hover:text-[#EA7712] transition-colors focus:outline-none focus:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#FF851B] hover:bg-[#EA7712] active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FF8A1F]/30 mt-2"
            >
              {loading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

            {/* Subtle Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8] dark:text-[#7C8799] pt-2">
              <Icon icon="heroicons:shield-check" className="w-3.5 h-3.5 text-[#12B76A]" />
              <span>Secured with enterprise 256-bit encryption</span>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-fast">
          <div className="w-full max-w-md bg-white dark:bg-[#171A21] border border-[#E2E8F0] dark:border-[#2B313C] rounded-2xl shadow-xl p-6 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2B313C] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF8A1F]/10 text-[#FF8A1F] flex items-center justify-center">
                  <Icon icon="heroicons:key" className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Reset password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </button>
            </div>

            {recoverySuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-[#ECFDF3] dark:bg-[#12B76A]/10 border border-[#12B76A]/20 text-[#12B76A] rounded-xl text-xs font-medium flex items-start gap-3">
                  <Icon icon="heroicons:check-circle" className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Check your email inbox</p>
                    <p className="leading-relaxed">
                      We've sent password reset instructions to <strong>{recoveryEmail}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full h-10 bg-[#FF851B] hover:bg-[#EA7712] text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
                >
                  Return to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                  Enter your registered work email address and we'll send you a link to reset your password.
                </p>

                {recoveryError && (
                  <div className="p-3 bg-[#FEF3F2] dark:bg-[#F04438]/10 border border-[#FEE4E2] dark:border-[#F04438]/20 text-[#D92D20] dark:text-[#F04438] rounded-xl text-xs font-medium flex items-center gap-2">
                    <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 shrink-0" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                <EronInput
                  id="recovery-email"
                  type="email"
                  label="Work Email Address"
                  icon="heroicons:envelope"
                  value={recoveryEmail}
                  onChange={(e) => {
                    setRecoveryEmail(e.target.value);
                    if (recoveryError) setRecoveryError('');
                  }}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                  disabled={recoveryLoading}
                />

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 h-10 border border-[#CBD5E1] dark:border-[#343B48] text-[#475569] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#232832] font-semibold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="px-4 h-10 bg-[#FF851B] hover:bg-[#EA7712] text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {recoveryLoading ? (
                      <>
                        <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                        <span>Sending link...</span>
                      </>
                    ) : (
                      <span>Send reset link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Outside Card */}
      <footer className="text-xs text-[#94A3B8] dark:text-[#7C8799] text-center font-medium py-2">
        Eron-CRM &copy; {new Date().getFullYear()} &middot; Powered by Sysdevcode
      </footer>
    </div>
  );
};

export default Login;
