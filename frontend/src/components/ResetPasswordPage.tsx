import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { verifyResetTokenApi, resetPasswordWithTokenApi } from '../services/api';
import { AuthBrandPanel } from './AuthBrandPanel';

interface ResetPasswordPageProps {
  token?: string | null;
  onGoLogin: () => void;
  onGoForgotPassword: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token: initialToken,
  onGoLogin,
  onGoForgotPassword,
}) => {
  const { theme, toggleTheme } = useTheme();

  const [token, setToken] = useState(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; token?: string }>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialToken && initialToken.trim().length > 0) {
      setToken(initialToken.trim());
      verifyToken(initialToken.trim());
    }
  }, [initialToken]);

  const verifyToken = async (tok: string) => {
    setVerifying(true);
    setTokenError(null);
    try {
      const res = await verifyResetTokenApi(tok);
      if (res.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setTokenError(res.message || 'This reset token is invalid or has expired.');
      }
    } catch (err: any) {
      setTokenValid(false);
      setTokenError(err.message || 'Failed to verify reset token.');
    } finally {
      setVerifying(false);
    }
  };

  const validate = () => {
    const errs: { password?: string; confirmPassword?: string; token?: string } = {};

    if (!token.trim()) {
      errs.token = 'Reset token is required.';
    }

    if (!password) {
      errs.password = 'New password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your new password.';
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
      await resetPasswordWithTokenApi(token.trim(), password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Token may have expired.');
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

      <div className="w-full max-w-4xl bg-[#0b0e14]/90 border border-white/[0.08] backdrop-blur-2xl rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Left Side: Branding */}
        <AuthBrandPanel />

        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  Reset Password
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose a new secure password for your account.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoLogin}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            </div>

            {success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Password Reset Successful</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your password has been securely updated. You can now log into your terminal with your new credentials.
                </p>
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
                >
                  Sign In Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    {error}
                  </div>
                )}

                {tokenError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    {tokenError}
                  </div>
                )}

                {/* Token input (if not pre-populated) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Security Reset Token
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        if (errors.token) setErrors({ ...errors, token: undefined });
                      }}
                      onBlur={() => {
                        if (token.trim() && tokenValid === null) {
                          verifyToken(token.trim());
                        }
                      }}
                      placeholder="Paste your 64-char token here..."
                      className={`w-full bg-[#121620] border ${
                        errors.token
                          ? 'border-red-500'
                          : tokenValid === true
                          ? 'border-emerald-500/50'
                          : 'border-white/10 focus:border-amber-400/50'
                      } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition`}
                    />
                    {verifying && (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.token && (
                    <p className="text-[11px] text-red-400 mt-1">{errors.token}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      placeholder="At least 6 characters"
                      className={`w-full bg-[#121620] border ${
                        errors.password ? 'border-red-500' : 'border-white/10 focus:border-amber-400/50'
                      } rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition`}
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                      }}
                      placeholder="Re-type your password"
                      className={`w-full bg-[#121620] border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-white/10 focus:border-amber-400/50'
                      } rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition`}
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-red-400 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span>Need a new link?</span>
            <button
              type="button"
              onClick={onGoForgotPassword}
              className="text-amber-400 hover:underline cursor-pointer font-medium"
            >
              Request Password Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
