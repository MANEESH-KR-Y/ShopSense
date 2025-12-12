import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMsg("");

        try {
            await authAPI.sendOtp(email);
            setStep(2);
            setMsg("OTP sent to your email!");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMsg("");

        try {
            await authAPI.resetPassword({ email, otp, newPassword });
            setMsg("Password reset successfully! Redirecting...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(err.response?.data?.error || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center p-4">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="max-w-md w-full border border-[var(--color-brand-border)] p-10 bg-[var(--color-brand-surface)]/80 backdrop-blur-xl rounded-2xl shadow-2xl relative animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-brand-text)] mb-2 tracking-tight">
                        Reset Password
                    </h1>
                    <p className="text-[var(--color-brand-text-muted)] text-sm">
                        {step === 1 ? "Enter your email to get a verification code" : "Enter OTP and your new password"}
                    </p>
                </div>

                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-center">{error}</div>}
                {msg && <div className="bg-green-500/10 text-green-400 p-3 rounded mb-4 text-center">{msg}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div>
                            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none"
                                placeholder="name@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all"
                        >
                            {loading ? "Sending OTP..." : "SEND OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">OTP</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[var(--color-brand-black)]/50 border border-[var(--color-brand-border)] rounded-xl px-4 py-3.5 text-[var(--color-brand-text)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none"
                                placeholder="Min 8 chars"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all"
                        >
                            {loading ? "Resetting..." : "RESET PASSWORD"}
                        </button>
                    </form>
                )}

                <div className="text-center mt-6 pt-6 border-t border-[var(--color-brand-border)]">
                    <Link to="/login" className="text-[var(--color-brand-text-muted)] hover:text-white text-sm font-bold transition-colors">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
