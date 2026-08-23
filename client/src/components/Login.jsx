import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-gradient-to-br from-[#EAC23F] via-sky-50 to-white flex flex-col relative overflow-hidden font-sans text-slate-600">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/40 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] border border-white/20 rounded-full"></div>
      </div>

      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-black/20">
          <Icon icon="mdi:lightning-bolt" className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-brand-black text-xl tracking-tight leading-none">Eron-CRM</span>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">Powered by sysdevcode</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px]"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
            <div className="text-center mb-6">
              <div className="w-10 h-10 mx-auto bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                <Icon icon="mdi:login-variant" className="w-5 h-5 text-brand-black" />
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-1">
                Sign in with email
              </h1>
              <p className="text-slate-500 text-xs px-4">
                Manage your relationships, sales, and tasks in one place. For free.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon icon="mdi:email" className="text-slate-400 w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-brand-black pl-9 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-brand-black/5 transition-all placeholder-slate-400 text-sm font-medium"
                    placeholder="Email"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon icon="mdi:lock" className="text-slate-400 w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-brand-black pl-9 pr-9 py-3 rounded-xl border-none focus:ring-2 focus:ring-brand-black/5 transition-all placeholder-slate-400 text-sm font-medium"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <Icon icon={showPassword ? "mdi:eye-outline" : "mdi:eye-off-outline"} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-slate-500 hover:text-brand-black transition-colors">
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1F1C19] hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg shadow-black/5 hover:shadow-black/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Get Started</span>
                )}
              </button>
            </form>


          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
