import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Phone, ArrowRight, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthBrandPanel } from './AuthBrandPanel';

interface LoginPageProps {
  onGoRegister: () => void;
  onGoForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoRegister, onGoForgotPassword }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim().replace(/\s+/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(cleanMobile, password);
    } catch (err: any) {
      setError(err.message || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080b] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none" />

      {/* Theme toggle switch */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-xl border border-white/10 bg-white/5 text-amber-300 hover:border-amber-400/40 transition text-xs z-50 cursor-pointer"
        title="Toggle Theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Main Dual-Panel Luxury Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-amber-500/25 shadow-[0_10px_60px_rgba(0,0,0,0.85)] bg-white dark:bg-[#0c0f16]">
        {/* Left Panel: Luxury Brand & Jewelry Showcase */}
        <AuthBrandPanel />

        {/* Right Panel: Login Form */}
        <div className="flex flex-col justify-between p-8 md:p-12 bg-white dark:bg-[#0c0f16]">
          {/* Mobile Top Brand Header */}
          <div className="md:hidden text-center mb-6">
            <h1 className="font-serif text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 uppercase">
              RUDRA SILVER
            </h1>
            <p className="font-serif italic text-amber-400/60 text-[11px] mt-0.5">
              Timeless Elegance, Forever Yours
            </p>
          </div>

          <div className="my-auto">
            {/* Form Title */}
            <div className="mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Sign in to your account
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {/* Mobile Number Input */}
              <div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    placeholder="Mobile Number"
                    autoComplete="tel"
                    maxLength={15}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15 transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-amber-500 cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={onGoForgotPassword}
                  className="text-amber-600 dark:text-amber-400/90 hover:text-amber-500 font-medium transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Gold Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_24px_rgba(212,175,55,0.35)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
              <span className="absolute px-3 bg-white dark:bg-[#0c0f16] text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                or
              </span>
            </div>

            {/* Create New Account Button */}
            <button
              type="button"
              onClick={onGoRegister}
              className="w-full py-2.5 rounded-xl border border-amber-500/30 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Account</span>
            </button>
          </div>

          {/* Footer copyright */}
          <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500">
            &copy; 2026 Rudra Silver. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
