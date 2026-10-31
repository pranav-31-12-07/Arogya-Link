import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function Signup() {
  const { signup, authError, setAuthError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setAuthError('Please agree to the Telehealth Terms & Privacy Policy to continue.');
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, name);
      // Redirect to text-mode consultation upon successful registration
      window.location.href = '/text-mode.html';
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      {/* Top Header */}
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
          href="/login.html"
          className="text-xs font-semibold text-[#16865B] hover:text-[#116B49] bg-[#E8F5EE] px-4 py-2 rounded-full transition"
        >
          Already have an account? Sign In
        </a>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#E4EBE6] p-8 md:p-10 transition-all">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5EE] text-[#16865B] mb-4 shadow-xs">
              <Heart className="w-8 h-8 fill-[#16865B]" />
            </div>
            <h1 className="text-2xl font-black text-[#172B24] tracking-tight">
              Create Patient Account
            </h1>
            <p className="text-xs text-[#718078] mt-1.5 font-medium">
              Join AAROGYA LINK for AI-assisted telehealth in your local language
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172B24] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="signup-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4EBE6] text-sm text-[#172B24] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B24] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="signup-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4EBE6] text-sm text-[#172B24] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B24] mb-1.5">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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

            <div>
              <label className="block text-xs font-bold text-[#172B24] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-confirm-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4EBE6] text-sm text-[#172B24] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="signup-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#E4EBE6] text-[#16865B] focus:ring-[#16865B]"
                />
                <span className="text-xs text-[#718078] leading-tight">
                  I consent to AI-assisted telehealth triage and agree to the <a href="#" className="text-[#16865B] font-semibold hover:underline">Terms of Service</a> & <a href="#" className="text-[#16865B] font-semibold hover:underline">Patient Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#16865B] hover:bg-[#116B49] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E4EBE6] text-center">
            <p className="text-xs text-[#718078]">
              Already have an account?{' '}
              <a href="/login.html" className="font-bold text-[#16865B] hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#718078]">
        © 2025 AAROGYA LINK • Rural & Regional Telehealth Network
      </footer>
    </div>
  );
}
