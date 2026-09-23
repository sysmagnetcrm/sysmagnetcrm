import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

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
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'request'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#0B0D11] text-[#F8FAFC] flex flex-col justify-between items-center p-3 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Dynamic Background Glowing Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF8A1F]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Mobile Status Header / Brand bar */}
      <header className="w-full max-w-[440px] flex items-center justify-between py-2 px-1 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#FF8A1F] text-white rounded-lg flex items-center justify-center font-extrabold text-sm shadow-md">
            S
          </div>
          <span className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">
            Sysmagnet
          </span>
        </div>
        <div className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Online</span>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="w-full max-w-[440px] my-auto py-4 z-10">
        <div className="w-full bg-[#14171E]/90 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl p-6 sm:p-8 transition-all relative overflow-hidden">
          
          {/* Top Hero Ambient Header (Reference 1 & 2 fusion) */}
          <div className="relative mb-6 pt-2 text-center">
            {/* Ambient Profile/Card Stack Graphics */}
            <div className="flex justify-center items-center gap-2 mb-4 opacity-40">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-xs text-white/70 shadow-sm">
                <Icon icon="heroicons:user-group" className="w-5 h-5 text-amber-400" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm text-amber-300 shadow-lg scale-110">
                <Icon icon="heroicons:sparkles" className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-xs text-white/70 shadow-sm">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {activeTab === 'signin' ? 'Welcome back' : 'Create Account'}
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5 max-w-[320px] mx-auto leading-relaxed">
              {activeTab === 'signin' 
                ? 'Sign in to manage your workspace, clients and deals'
                : 'Contact your workspace administrator to set up access'}
            </p>
          </div>

          {/* Segmented Tab Switcher (Inspired by Doshe Reference UI) */}
          <div className="bg-[#1E232D] p-1.5 rounded-full flex items-center mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === 'signin'
                  ? 'bg-white text-[#0B0D11] shadow-md scale-[1.02]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === 'request'
                  ? 'bg-white text-[#0B0D11] shadow-md scale-[1.02]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Content Section */}
          {activeTab === 'signin' ? (
            <div>
              {/* Section Sublabel */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-white">Sign in to continue</h2>
                <p className="text-[11px] text-[#7C8799]">
                  Access your dashboard, products, and client pipeline tools.
                </p>
              </div>

              {/* Sanitized Error Alert */}
              {error && (
                <div
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn"
                  role="alert"
                >
                  <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate={false}>
                {/* Email Input Field */}
                <div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-[#7C8799] pointer-events-none">
                      <Icon icon="heroicons:user" className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Work Email or Username"
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="w-full h-12 pl-11 pr-4 bg-[#1B202A] border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF8A1F] focus:ring-2 focus:ring-[#FF8A1F]/20 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password Input Field */}
                <div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-[#7C8799] pointer-events-none">
                      <Icon icon="heroicons:lock-closed" className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Password"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full h-12 pl-11 pr-11 bg-[#1B202A] border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF8A1F] focus:ring-2 focus:ring-[#FF8A1F]/20 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-[#7C8799] hover:text-white transition-colors focus:outline-none"
                      aria-label="Toggle password visibility"
                    >
                      <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Primary CTA Button (Reference Style) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 bg-[#FF851B] hover:bg-[#EA7712] active:scale-[0.98] text-white font-semibold text-sm rounded-full transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FF8A1F]/40"
                >
                  {loading ? (
                    <>
                      <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Sign In</span>
                      <Icon icon="heroicons:arrow-right" className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {/* Secondary Action Links */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('request')}
                    className="text-[#94A3B8] hover:text-white transition-colors font-medium"
                  >
                    No account yet? <span className="text-[#FF8A1F] font-semibold underline">Create one</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email);
                      setRecoveryError('');
                      setRecoverySuccess(false);
                      setShowForgotPassword(true);
                    }}
                    className="text-[#7C8799] hover:text-white transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Request Access / Account Creation View */
            <div className="space-y-4 py-2 text-center animate-fadeIn">
              <div className="w-14 h-14 bg-[#FF8A1F]/15 border border-[#FF8A1F]/30 text-[#FF8A1F] rounded-full flex items-center justify-center mx-auto mb-2">
                <Icon icon="heroicons:user-plus" className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Create New Workspace Account</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Sysmagnet-CRM accounts are managed by your administrator. Contact your team admin or system manager to receive your sign-in credentials.
              </p>
              
              <div className="p-3.5 bg-[#1B202A] border border-white/10 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Icon icon="heroicons:check-circle" className="w-4 h-4 shrink-0" />
                  <span>Role-Based Access Control Enabled</span>
                </div>
                <p className="text-[#7C8799] pl-6 text-[11px]">
                  Administrators can grant permissions for client management, deal tracking, and marketing tools.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="w-full h-12 bg-white text-[#0B0D11] hover:bg-slate-100 font-bold text-sm rounded-full transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
              >
                <span>Back to Sign In</span>
                <Icon icon="heroicons:arrow-right" className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Subtle Security Badge Footer inside Card */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] pt-6 border-t border-white/5 mt-6">
            <Icon icon="heroicons:shield-check" className="w-4 h-4 text-emerald-400" />
            <span>Secured with enterprise 256-bit encryption</span>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#14171E] border border-white/10 rounded-3xl shadow-2xl p-6 transition-all text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF8A1F]/15 text-[#FF8A1F] flex items-center justify-center border border-[#FF8A1F]/20">
                  <Icon icon="heroicons:key" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset password</h3>
                  <p className="text-[11px] text-[#7C8799]">Send recovery link to your inbox</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-[#7C8799] hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </button>
            </div>

            {recoverySuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-medium flex items-start gap-3">
                  <Icon icon="heroicons:check-circle" className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-sm mb-1 text-white">Check your email inbox</p>
                    <p className="leading-relaxed text-[#94A3B8]">
                      We've sent password reset instructions to <strong className="text-white">{recoveryEmail}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full h-11 bg-[#FF851B] hover:bg-[#EA7712] text-white font-semibold text-sm rounded-full transition-all shadow-md"
                >
                  Return to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Enter your registered work email address and we'll send you a link to reset your password.
                </p>

                {recoveryError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-medium flex items-center gap-2">
                    <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#7C8799] pointer-events-none">
                    <Icon icon="heroicons:envelope" className="w-4 h-4" />
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => {
                      setRecoveryEmail(e.target.value);
                      if (recoveryError) setRecoveryError('');
                    }}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    disabled={recoveryLoading}
                    className="w-full h-12 pl-11 pr-4 bg-[#1B202A] border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF8A1F] focus:ring-2 focus:ring-[#FF8A1F]/20 transition-all disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 h-10 border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/5 font-semibold text-xs rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="px-5 h-10 bg-[#FF851B] hover:bg-[#EA7712] text-white font-semibold text-xs rounded-full transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
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

      {/* Global Page Footer */}
      <footer className="text-[11px] text-[#64748B] text-center font-medium py-2 z-10 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>Sysmagnet-CRM &copy; {new Date().getFullYear()}</span>
        <span className="hidden sm:inline">&middot;</span>
        <div className="flex items-center gap-3 text-[#94A3B8]">
          <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
          <span>&middot;</span>
          <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;

