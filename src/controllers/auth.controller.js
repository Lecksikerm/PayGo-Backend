const User = require("../models/user.model");
const Wallet = require("../models/wallet.model");
const generateOTP = require("../utils/generateOtp");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");

const {
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordChangedEmail
} = require("../services/email.service");

// REGISTER USER
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            isVerified: true, 
        });

        // Create wallet automatically
        await Wallet.create({
            user: user._id,
            balance: 0,
            currency: "NGN",
        });

        // Send welcome email only
        await sendWelcomeEmail(user.email, `${firstName} ${lastName}`);

        res.status(201).json({
            message: "Registration successful. You can now log in.",
            user: {
                id: user._id,
                firstName,
                lastName,
                email,
            },
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(400).json({ message: "Invalid email or password" });
        if (!user.isVerified) return res.status(400).json({ message: "Account not verified" });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            message: "Login successful",
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Generate OTP for password reset
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTPEmail(user.email, otp);

        res.json({ message: "OTP sent to email for password reset" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
        if (user.otpExpires < new Date()) return res.status(400).json({ message: "OTP expired" });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        await sendPasswordChangedEmail(user.email);

        res.json({ message: "Password reset successful. You may now log in." });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};




