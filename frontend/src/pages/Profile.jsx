import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { authAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
    const { user, logout } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", phone: "" });
    const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || ""
            });
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data } = await authAPI.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await authAPI.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await authAPI.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const { data } = await authAPI.updateProfile(form);
            setMessage(data.message || "Profile updated successfully");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passForm.currentPassword || !passForm.newPassword) {
            setError("Please fill all password fields");
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const { data } = await authAPI.changePassword(passForm);
            setMessage(data.message || "Password changed successfully");
            setPassForm({ currentPassword: "", newPassword: "" });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to change password");
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    }

    return (
        <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto bg-[var(--color-brand-black)] relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
                <div className="max-w-2xl mx-auto relative z-10 animate-fade-in-up">
                    <div className="flex justify-between items-end mb-8 border-b border-[var(--color-brand-border)] pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Your Profile</h1>
                            <p className="text-[var(--color-brand-text-muted)] mt-1">Manage your account details</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-bold transition-all"
                        >
                            Log Out
                        </button>
                    </div>

                    {/* Notifications Section */}
                    <div className="card mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                🔔 Notifications
                            </h2>
                            <button
                                onClick={handleMarkAllRead}
                                className="text-sm text-[var(--color-brand-blue)] hover:text-blue-400 font-bold"
                            >
                                Mark all as read
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {notifications.length === 0 ? (
                                <p className="text-[var(--color-brand-text-muted)] text-center py-4">No new notifications</p>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleMarkRead(notif.id)}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${notif.is_read ? 'bg-transparent border-[var(--color-brand-border)] opacity-60' : 'bg-[var(--color-brand-surface)] border-[var(--color-brand-blue)] shadow-md shadow-blue-900/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold ${notif.is_read ? 'text-[var(--color-brand-text-muted)]' : 'text-white'}`}>{notif.title}</h3>
                                            <span className="text-xs text-[var(--color-brand-text-muted)]">{new Date(notif.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-[var(--color-brand-text-muted)]">{notif.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card space-y-8">
                        {message && <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-bold text-center">{message}</div>}
                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-bold text-center">{error}</div>}

                        {/* Profile Info Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Personal Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="btn btn-primary py-2.5 px-6 text-sm">
                                    {loading ? "Saving..." : "Update Profile"}
                                </button>
                            </div>
                        </form>

                        <div className="border-t border-[var(--color-brand-border)] my-8"></div>

                        {/* Change Password Form */}
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Security</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="••••••••"
                                        value={passForm.currentPassword}
                                        onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Min 8 characters"
                                        value={passForm.newPassword}
                                        onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] text-white hover:bg-[var(--color-brand-border)] rounded-xl font-bold text-sm transition-all">
                                    {loading ? "Changing..." : "Change Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
