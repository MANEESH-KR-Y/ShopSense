import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await register(form);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="max-w-md w-full border border-[var(--color-brand-border)] p-10 bg-[var(--color-brand-surface)]/80 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-text)] mb-2 tracking-tight">
            Create Account
          </h1>
          <p className="text-[var(--color-brand-text-muted)] text-sm">Join ShopSense today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm font-medium p-4 mb-6 text-center border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">
              Phone
            </label>
            <input
              type="tel"
              className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-orange-900/20 hover:shadow-orange-900/40 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {isLoading ? 'Creating Account...' : 'REGISTER'}
          </button>
        </form>

        <div className="text-center mt-8 pt-8 border-t border-[var(--color-brand-border)]">
          <p className="text-[var(--color-brand-text-muted)] text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue-hover)] font-bold transition-colors ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
