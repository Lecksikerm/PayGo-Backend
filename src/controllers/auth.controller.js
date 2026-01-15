const User = require("../models/user.model");
const generateOTP = require("../utils/generateOtp");
const transporter = require("../config/mail");
const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/generateToken");


exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            otp,
            otpExpires,
        });

        // Send OTP Mail
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: user.email,
            subject: "PayGo Account Verification OTP",
            text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
        });

        // Response
        res.status(201).json({
            message: "Registration successful. OTP sent to email.",
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


exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });

        if (user.otp !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

        if (user.otpExpires < new Date())
            return res.status(400).json({ message: "OTP expired" });

        // Update user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            message: "OTP verified successfully. You can now log in."
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid email or password" });

        if (!user.isVerified)
            return res.status(400).json({ message: "Account not verified" });

        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid email or password" });

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
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Generate reset OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send email
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: email,
            subject: "PayGo Password Reset OTP",
            text: `Your OTP for resetting password is: ${otp}. It expires in 10 minutes.`,
        });

        res.json({ message: "OTP sent to email for password reset" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.otp !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

        if (user.otpExpires < new Date())
            return res.status(400).json({ message: "OTP expired" });

        // Change password
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: "Password reset successful. You may now log in." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



