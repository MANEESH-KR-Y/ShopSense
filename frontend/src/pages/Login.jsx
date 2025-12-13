import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PageTransition from "../components/PageTransition";

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
    <PageTransition>
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-brand-black)] relative overflow-hidden">
        {/* Background Noise & Gradient */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-40 blur-3xl pointer-events-none animate-aurora"
          style={{
            backgroundSize: "200% 200%",
            backgroundImage: `
                 radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.4), transparent 25%), 
                 radial-gradient(circle at 85% 30%, rgba(124, 58, 237, 0.4), transparent 25%)
               `
          }}
        ></div>

        <div className="glass-panel p-10 rounded-[var(--radius-card)] max-w-md w-full relative z-10 animate-fade-in-up flex flex-col shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-[var(--color-brand-blue)] to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 text-white transform rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-[var(--color-brand-text-muted)] text-base font-medium">
              Sign in to manage your inventory
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-black/30 p-1.5 rounded-full mb-8 border border-white/5 relative">
            {/* Animated Slider could go here, for now simple buttons */}
            <button
              onClick={() => setLoginMode("password")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${loginMode === 'password' ? 'bg-[var(--color-brand-blue)] text-white shadow-lg' : 'text-[var(--color-brand-text-muted)] hover:text-white'}`}
            >
              Password
            </button>
            <button
              onClick={() => setLoginMode("otp")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${loginMode === 'otp' ? 'bg-[var(--color-brand-blue)] text-white shadow-lg' : 'text-[var(--color-brand-text-muted)] hover:text-white'}`}
            >
              Verify OTP
            </button>
          </div>

          {error && <div className="bg-red-500/10 text-red-400 text-sm font-medium p-4 mb-6 text-center border border-red-500/20 rounded-xl">{error}</div>}
          {msg && <div className="bg-green-500/10 text-green-400 text-sm font-medium p-4 mb-6 text-center border border-green-500/20 rounded-xl">{msg}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Email or Mobile Number"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            {loginMode === 'password' ? (
              <div className="space-y-2">
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-[var(--color-brand-blue)] hover:text-white font-bold transition-colors">Forgot Password?</Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    disabled={!otpSent}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className={`px-5 py-3 border rounded-xl text-sm font-bold transition-all whitespace-nowrap btn-secondary
                    ${(loading || otpSent || resendTimer > 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={loading || resendTimer > 0}
                  >
                    {resendTimer > 0 ? `${resendTimer}s` : (otpSent ? "Resend" : "Get Code")}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-4 text-base tracking-widest mt-4"
            >
              {loading ? "AUTHENTICATING..." : (loginMode === 'password' ? "LOGIN TO DASHBOARD" : "VERIFY & PROCEED")}
            </button>
          </form>

          <div className="text-center mt-8 pt-8 border-t border-white/5">
            <p className="text-[var(--color-brand-text-muted)] text-sm">
              New here?{" "}
              <Link to="/register" className="text-white hover:text-[var(--color-brand-blue)] font-bold transition-colors ml-1 decoration-skip-ink underline decoration-white/20 underline-offset-4 hover:decoration-[var(--color-brand-blue)]">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

