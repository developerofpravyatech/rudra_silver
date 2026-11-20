import React, { useState, useEffect } from 'react';
import { Phone, Lock, Eye, EyeOff, Send, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { sendOtpApi, resetPasswordApi } from '../services/api';
import { AuthBrandPanel } from './AuthBrandPanel';

interface ForgotPasswordPageProps {
  onGoLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onGoLogin }) => {
  const { theme, toggleTheme } = useTheme();

  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState<'SEND_OTP' | 'VERIFY_AND_RESET'>('SEND_OTP');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Status & timer states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Timer countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtpApi(cleanMobile);
      if (res.dev_otp) {
        setSuccessMsg(`OTP sent via SMS. [Dev Fallback OTP: ${res.dev_otp}]`);
      } else {
        setSuccessMsg(res.message || 'OTP verification code has been dispatched via SMS.');
      }
      setCooldown(res.cooldown_seconds || 60);
      setStep('VERIFY_AND_RESET');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    setLoading(true);
    try {
      const res = await sendOtpApi(cleanMobile);
      setSuccessMsg('A new verification OTP has been dispatched to your mobile.');
      setCooldown(res.cooldown_seconds || 60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the verification OTP received on your mobile.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordApi(cleanMobile, cleanOtp, newPassword);
      setSuccessMsg(res.message || 'Password successfully reset! Redirecting to sign in...');
      setTimeout(() => {
        onGoLogin();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your OTP.');
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
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Forgot Password?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {step === 'SEND_OTP'
                  ? "Enter your registered mobile number and we'll send you an OTP"
                  : `Enter the verification OTP sent to +91 ${mobile} and choose a new password`}
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
            {successMsg && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1: Enter Mobile & Request OTP */}
            {step === 'SEND_OTP' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      placeholder="Registered Mobile Number"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15 transition"
                    />
                  </div>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_24px_rgba(212,175,55,0.35)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Verify OTP & Enter New Password */
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                {/* Mobile number display */}
                <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
                  <span>Mobile: <strong className="text-slate-800 dark:text-slate-200">+91 {mobile}</strong></span>
                  <button
                    type="button"
                    onClick={() => setStep('SEND_OTP')}
                    className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* OTP Field with Resend countdown */}
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-11 pr-28 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono tracking-wider text-xs focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15 transition"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {cooldown > 0 ? (
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          Resend in {cooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="New Password (min 6 characters)"
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm New Password"
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-400/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 active:scale-[0.99] text-slate-950 font-bold text-xs tracking-wide shadow-[0_4px_24px_rgba(212,175,55,0.35)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}

            {/* Back to Login link */}
            <div className="mt-6 text-center">
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
