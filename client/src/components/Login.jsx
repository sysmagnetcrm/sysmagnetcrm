import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-md bg-white rounded-[16px] border border-[#E5E7EB] shadow-card p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FF8A1F] rounded-[12px] flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-subtle">
            E
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to Eron-CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise Sales & Relationship Management</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-[#DC2626] rounded-[8px] text-xs font-medium flex items-center gap-2">
            <Icon icon="heroicons:exclamation-circle" className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="saas-label" htmlFor="email-input">Work Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon icon="heroicons:envelope" className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="saas-input pl-9"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="saas-label" htmlFor="password-input">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon icon="heroicons:lock-closed" className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="saas-input pl-9 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        Eron-CRM &copy; {new Date().getFullYear()} • Powered by sysdevcode
      </div>
    </div>
  );
};

export default Login;
