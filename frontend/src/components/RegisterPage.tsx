import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon, Mail, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { registerApi } from '../services/api';
import { AuthBrandPanel } from './AuthBrandPanel';

interface RegisterPageProps {
  onGoLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoLogin }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Field-wise validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await registerApi({
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      setSuccess(true);

      // Attempt automatic login after registration, else direct to login page
      try {
        await login(email.trim(), password);
      } catch {
        setTimeout(() => {
          onGoLogin();
        }, 1500);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed. Email might already be in use.';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080b] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none" />

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

        {/* Right Panel: Register Form */}
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
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Join Rudra Silver Family
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Account created successfully! Loading your workspace...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate autoComplete="on">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none transition ${errors.name
                      ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
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
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="name@domain.com"
                    autoComplete="email"
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none transition ${errors.email
                      ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className={`w-full pl-11 pr-11 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none transition ${errors.password
                      ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition cursor-pointer"
                    title={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className={`w-full pl-11 pr-11 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none transition ${errors.confirmPassword
                      ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition cursor-pointer"
                    title={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>•</span> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Gold Register Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_24px_rgba(212,175,55,0.35)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
            </div>

            {/* Sign In Link */}
            <div className="text-center text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onGoLogin}
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold transition cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Footer copyright */}
          <div className="mt-6 text-center text-[10px] text-slate-400 dark:text-slate-500">
            &copy; 2026 Rudra Silver. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
