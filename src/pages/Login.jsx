import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, resetPassword, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // Redirect to text-mode consultation upon successful login
      window.location.href = '/text-mode.html';
    } catch (err) {
      console.error('Failed to log in:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email address first to receive a password reset link.');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo.patient@aarogyalink.org');
    setPassword('Aarogya@2025');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      {/* Top Simple Brand Header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <a href="/login.html" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F5EE] border border-[#c4e3d3] flex items-center justify-center text-[#16865B]">
            <Heart className="w-5 h-5 fill-[#16865B]" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#172B24]">
            AAROGYA LINK
          </span>
        </a>
        <a
          href="/signup.html"
          className="text-xs font-semibold text-[#16865B] hover:text-[#116B49] bg-[#E8F5EE] px-4 py-2 rounded-full transition"
        >
          Create New Account
        </a>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#E4EBE6] p-8 md:p-10 transition-all">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5EE] text-[#16865B] mb-4 shadow-xs">
              <Heart className="w-8 h-8 fill-[#16865B]" />
            </div>
            <h1 className="text-2xl font-black text-[#172B24] tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-[#718078] mt-1.5 font-medium">
              Access your medical consultations, reports, and AI assistant
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {resetSent && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#E8F5EE] border border-[#c4e3d3] text-xs text-[#116B49] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16865B] shrink-0 mt-0.5" />
              <span>Password reset email sent! Check your inbox for instructions.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172B24] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="login-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4EBE6] text-sm text-[#172B24] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#172B24]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[#16865B] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#E4EBE6] text-sm text-[#172B24] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718078] hover:text-[#172B24]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E4EBE6] text-[#16865B] focus:ring-[#16865B]"
                />
                <span className="text-xs text-[#718078]">Remember my login</span>
              </label>

              <button
                type="button"
                onClick={handleDemoFill}
                className="text-[11px] text-[#16865B] hover:underline font-semibold"
              >
                Demo Fill
              </button>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#16865B] hover:bg-[#116B49] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E4EBE6] text-center">
            <p className="text-xs text-[#718078]">
              Don't have an AAROGYA LINK account?{' '}
              <a href="/signup.html" className="font-bold text-[#16865B] hover:underline">
                Register here
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#718078]">
        © 2025 AAROGYA LINK • Secure Firebase Authentication
      </footer>
    </div>
  );
}
