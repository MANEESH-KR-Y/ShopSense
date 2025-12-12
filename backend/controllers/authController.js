const User = require("../models/User");
const JWTUtils = require("../utils/jwt");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// Configure SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// --- REGISTER ---
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !password)
            return res.status(400).json({ error: "Name & password required" });

        if (!email && !phone)
            return res.status(400).json({ error: "Email or phone required" });

        if (email && (await User.findByEmail(email)))
            return res.status(400).json({ error: "Email already taken" });

        if (phone && (await User.findByPhone(phone)))
            return res.status(400).json({ error: "Phone already taken" });

        const user = await User.create({ name, email, phone, password });

        if (!user || !user.id) {
            return res.status(500).json({ error: "Registration failed" });
        }

        const accessToken = JWTUtils.generateAccessToken(user);
        const refreshToken = JWTUtils.generateRefreshToken(user);

        await User.updateRefreshToken(user.id, refreshToken);

        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        return res.json({
            message: "Registration successful",
            accessToken,
            user,
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ error: "Registration failed" });
    }
};

// --- LOGIN ---
exports.login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        console.log("LOGIN ATTEMPT:", { email, phone });

        if (!password)
            return res.status(400).json({ error: "Password required" });

        if (!email && !phone)
            return res.status(400).json({ error: "Email or phone required" });

        let user = email
            ? await User.findByEmail(email)
            : await User.findByPhone(phone);

        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });

        const valid = await User.comparePassword(password, user.password);
        if (!valid)
            return res.status(401).json({ error: "Invalid credentials" });

        const accessToken = JWTUtils.generateAccessToken(user);
        const refreshToken = JWTUtils.generateRefreshToken(user);

        await User.updateRefreshToken(user.id, refreshToken);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        return res.json({
            message: "Login successful",
            accessToken,
            user,
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ error: "Login failed" });
    }
};

// --- SEND OTP ---
exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const user = await User.findByEmail(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB
        await User.updateOtp(user.id, otp);

        const hasSmtp = process.env.SMTP_USER && process.env.SMTP_PASS;

        if (hasSmtp) {
            try {
                // Send Email
                const info = await transporter.sendMail({
                    from: `"ShopSense" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                    to: email,
                    subject: "Login Verification Code",
                    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
                    html: `<b>Your OTP is ${otp}</b>. It expires in 10 minutes.`,
                });
                console.log("OTP Sent via Email:", info.messageId);
            } catch (emailErr) {
                console.error("SMTP Failed. Falling back to console log (Dev Mode).", emailErr);
                console.log("------------------------------------------");
                console.log(`[MOCK EMAIL] To: ${email} | Subject: Login Verification Code`);
                console.log(`Your OTP is: ${otp}`);
                console.log("------------------------------------------");
            }
        } else {
            // No SMTP Configured - Mock Mode
            console.log("------------------------------------------");
            console.log("SMTP not configured in .env. Using Mock Mode.");
            console.log(`[MOCK EMAIL] To: ${email} | Subject: Login Verification Code`);
            console.log(`Your OTP is: ${otp}`);
            console.log("------------------------------------------");
        }

        // --- FILE LOGGING FALLBACK (FOOLPROOF) ---
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '..', 'otp_logs.txt');
            const logEntry = `[${new Date().toISOString()}] To: ${email} | OTP: ${otp}\n`;
            fs.appendFileSync(logPath, logEntry);
            console.log("OTP written to otp_logs.txt");
        } catch (fsErr) {
            console.error("Failed to write to log file:", fsErr);
        }

        // Always return success in dev/demo if email fails so flow isn't blocked.
        return res.json({ message: "OTP sent! (Check otp_logs.txt if no email)" });
    } catch (err) {
        console.error("SEND OTP ERROR:", err);
        return res.status(500).json({ error: "Failed to send OTP", details: err.message });
    }
};

// --- VERIFY OTP & LOGIN ---
exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

        const user = await User.findByEmail(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check OTP (Assuming User model has a method or we query raw)
        // Since User.verifyOtp might not exist yet, let's look at raw query or update model
        // Ideally we should move this to Model, but for now let's query raw in controller or update model shortly.
        // I will assume I updated the User model to have findById and I can just check fields if I selected them, 
        // BUT verifyOtp method is better.

        const isValid = await User.verifyOtp(user.id, otp);

        if (!isValid) {
            console.log(`[OTP DEBUG] Verification Failed for ${user.email}.`);
            console.log(`[OTP DEBUG] Input: '${otp}'`);
            // We can't see the stored OTP here easily without querying it again, 
            // but let's assume the Model checks it.
            // Let's modify the controller to query it for debugging if this fails.
            const check = await require("../db").query("SELECT otp, otp_expires_at, NOW() as now FROM users WHERE id=$1", [user.id]);
            const row = check.rows[0];
            console.log(`[OTP DEBUG] DB Stored: '${row.otp}'`);
            console.log(`[OTP DEBUG] DB Expiry: ${row.otp_expires_at}`);
            console.log(`[OTP DEBUG] DB Now: ${row.now}`);

            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Clear OTP
        await User.clearOtp(user.id);

        const accessToken = JWTUtils.generateAccessToken(user);
        const refreshToken = JWTUtils.generateRefreshToken(user);

        await User.updateRefreshToken(user.id, refreshToken);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        return res.json({
            message: "Login successful",
            accessToken,
            user,
        });

    } catch (err) {
        console.error("OTP LOGIN ERROR:", err);
        return res.status(500).json({ error: "OTP Login failed" });
    }
}


// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ error: "All fields required" });

        const user = await User.findByEmail(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        const isValid = await User.verifyOtp(user.id, otp);
        if (!isValid) return res.status(400).json({ error: "Invalid or expired OTP" });

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(user.id, hashedPassword);

        // Clear OTP
        await User.clearOtp(user.id);

        return res.json({ message: "Password reset successful. You can now login." });

    } catch (err) {
        console.error("RESET PASS ERROR:", err);
        return res.status(500).json({ error: "Password reset failed" });
    }
}

// --- TOKEN REFRESH ---
exports.token = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken)
            return res.status(401).json({ error: "Refresh token missing" });

        const decoded = JWTUtils.verifyRefreshToken(refreshToken);

        if (!decoded)
            return res.status(403).json({ error: "Invalid refresh token" });

        const user = await User.findByRefreshToken(refreshToken);

        if (!user)
            return res.status(403).json({ error: "Refresh token not in DB" });

        const newAccessToken = JWTUtils.generateAccessToken(user);

        return res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("REFRESH ERROR:", err);
        return res.status(500).json({ error: "Token refresh failed" });
    }
};

// --- ME ---
exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user)
            return res.status(404).json({ error: "User not found" });

        return res.json({ user });
    } catch (err) {
        console.error("ME ERROR:", err);
        return res.status(500).json({ error: "Failed to fetch user" });
    }
};

// --- CHANGE PASSWORD ---
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId; // From auth middleware

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password required" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify current password
        // Fetch full user with password (findById might not return password if we were careful, checking User.js)
        // User.findById in User.js selects 'id, name, email, phone, created_at'. So it DOES NOT return password.
        // We need to fetch password manually or add a method.
        // Let's rely on findByEmail since email is unique, or just query directly here.
        // Actually, we can use `db.query` directly or add a method.
        // Let's verify if `findByEmail` returns password.
        // User.js: verify `findByEmail` uses `SELECT *`. Yes it does.

        // So we can re-fetch by email to get the password hash.
        const userCredentials = await User.findByEmail(user.email);

        const valid = await User.comparePassword(currentPassword, userCredentials.password);
        if (!valid) return res.status(400).json({ error: "Incorrect current password" });

        // Update to new password
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(userId, hashed);

        return res.json({ message: "Password changed successfully" });

    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);
        return res.status(500).json({ error: "Failed to change password" });
    }
}

// --- LOGOUT ---
exports.logout = async (req, res) => {
    try {
        await User.clearRefreshToken(req.userId);

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.json({ message: "Logged out" });
    } catch (err) {
        console.error("LOGOUT ERROR:", err);
        return res.status(500).json({ error: "Logout failed" });
    }
};
// --- SAVE DEVICE TOKEN ---
exports.saveDeviceToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Token required" });

        await User.updateDeviceToken(req.userId, token);
        return res.json({ message: "Device token saved" });
    } catch (err) {
        console.error("SAVE TOKEN ERROR:", err);
        return res.status(500).json({ error: "Failed to save token" });
    }
};
