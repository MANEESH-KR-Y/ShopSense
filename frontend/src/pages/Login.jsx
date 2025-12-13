
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState("password"); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [resendTimer, setResendTimer] = useState(0);

  // Timer Countdown
  React.useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Send OTP
  const handleSendOtp = async () => {
    if (!identifier) {
      setError("Please enter email to send OTP");
      return;
    }
    if (resendTimer > 0) return;

    setLoading(true);
    setError("");
    setMsg("");
    try {
      await import("../services/api").then(m => m.authAPI.sendOtp(identifier));
      setOtpSent(true);
      setResendTimer(20); // 20 seconds cooldown
      setMsg("OTP Sent to " + identifier);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      let res;
      if (loginMode === 'password') {
        if (!identifier || !password) {
          setError("Please enter both email/mobile and password.");
          setLoading(false);
          return;
        }
        res = await login({ email: identifier, password });
      } else {
        // OTP Mode
        if (!identifier || !otp) {
          setError("Please enter email and OTP.");
          setLoading(false);
          return;
        }
        res = await loginWithOtp(identifier, otp);
      }

      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.error || "Login failed. Please check your credentials.");
      }
    } catch {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="max-w-md w-full border border-[var(--color-brand-border)] p-10 bg-[var(--color-brand-surface)]/80 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-fade-in-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-brand-text)] mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-[var(--color-brand-text-muted)] text-sm">
            Sign in to continue to ShopSense
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-[var(--color-brand-black)]/50 p-1 rounded-xl mb-6 border border-[var(--color-brand-border)]">
          <button
            onClick={() => setLoginMode("password")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === 'password' ? 'bg-[var(--color-brand-surface)] text-white shadow-sm' : 'text-[var(--color-brand-text-muted)] hover:text-white'}`}
          >
            Password Login
          </button>
          <button
            onClick={() => setLoginMode("otp")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === 'otp' ? 'bg-[var(--color-brand-surface)] text-white shadow-sm' : 'text-[var(--color-brand-text-muted)] hover:text-white'}`}
          >
            OTP Login
          </button>
        </div>

        {error && <div className="bg-red-500/10 text-red-400 text-sm font-medium p-4 mb-6 text-center border border-red-500/20 rounded-lg">{error}</div>}
        {msg && <div className="bg-green-500/10 text-green-400 text-sm font-medium p-4 mb-6 text-center border border-green-500/20 rounded-lg">{msg}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Email or Mobile</label>
            <input
              type="text"
              required
              className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
              placeholder="Enter your email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
            />
          </div>

          {loginMode === 'password' ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest ml-1">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue-hover)] font-bold">Forgot?</Link>
              </div>
              <input
                type="password"
                required
                className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">OTP Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none transition-all placeholder-[var(--color-brand-text-muted)]/50"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  disabled={!otpSent}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all whitespace-nowrap
                    ${(loading || otpSent || resendTimer > 0)
                      ? "bg-[var(--color-brand-surface)] border-[var(--color-brand-border)] text-[var(--color-brand-text-muted)] cursor-not-allowed"
                      : "bg-[var(--color-brand-surface)] border-[var(--color-brand-border)] text-[var(--color-brand-text)] hover:bg-[var(--color-brand-border)]"}`}
                  disabled={loading || resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : (otpSent ? "Resend OTP" : "Get OTP")}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-orange-900/20 hover:shadow-orange-900/40 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {loading ? "Processing..." : (loginMode === 'password' ? "SIGN IN" : "VERIFY & LOGIN")}
          </button>
        </form>

        <div className="text-center mt-8 pt-8 border-t border-[var(--color-brand-border)]">
          <p className="text-[var(--color-brand-text-muted)] text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue-hover)] font-bold transition-colors ml-1">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

