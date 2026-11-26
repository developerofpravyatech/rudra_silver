import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { forgotPasswordEmailApi } from '../services/api';
import { AuthBrandPanel } from './AuthBrandPanel';

interface ForgotPasswordPageProps {
  onGoLogin: () => void;
  onGoResetWithToken?: (token: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onGoLogin, onGoResetWithToken }) => {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const validate = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordEmailApi(email.trim());
      setSubmitted(true);
      if (res.dev_reset_url) {
        setDevResetUrl(res.dev_reset_url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset email. Please try again.');
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

        {/* Right Panel: Forgot Password Form */}
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
            <div className="mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Forgot Password?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {!submitted
                  ? 'Enter your registered email address and we will send you a secure password reset link.'
                  : 'Check your email inbox for your password reset link.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {!submitted ? (
              <form onSubmit={handleSendLink} className="space-y-4" noValidate>
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="name@domain.com"
                      autoComplete="email"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none transition ${
                        emailError
                          ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <span>•</span> {emailError}
                    </p>
                  )}
                </div>

                {/* Send Reset Link Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_24px_rgba(212,175,55,0.35)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Confirmation Box */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Reset Link Sent</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                    If an account exists with <strong className="font-semibold">{email}</strong>, you will receive an email shortly with a secure link to reset your password.
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80">
                    The reset link is valid for 60 minutes.
                  </p>
                </div>

                {/* Development Mode Quick Link (Visible if SMTP fallback / dev url present) */}
                {devResetUrl && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="font-semibold text-amber-500 dark:text-amber-400 text-[11px] uppercase tracking-wider">
                      🛠️ Dev / Local Preview Link
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Click below to open the reset password screen directly with this generated token:
                    </p>
                    {onGoResetWithToken ? (
                      <button
                        type="button"
                        onClick={() => {
                          const url = new URL(devResetUrl, window.location.origin);
                          const token = url.searchParams.get('token') || '';
                          onGoResetWithToken(token);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                      >
                        Open Reset Password Form
                      </button>
                    ) : (
                      <a
                        href={devResetUrl}
                        className="block py-2 px-3 text-center rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                      >
                        Open Reset Password Form
                      </a>
                    )}
                  </div>
                )}

                {/* Resend option */}
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                  Didn't receive an email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setDevResetUrl(null);
                    }}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    Try another email address
                  </button>
                </div>
              </div>
            )}

            {/* Back to Login link */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={onGoLogin}
                className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
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
