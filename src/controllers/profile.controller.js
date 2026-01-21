const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");
const {
    sendPasswordChangedEmail,
    sendAccountDeletedEmail
} = require("../services/email.service");


// GET PROFILE
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            message: "Profile fetched successfully",
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, address } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            message: "Profile updated successfully",
            user: userResponse
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both old and new password are required" });
        }

        const user = await User.findById(req.user.id).select("+password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

        const samePassword = await user.matchPassword(newPassword);
        if (samePassword) return res.status(400).json({ message: "New password cannot be the same as the old password" });

        user.password = newPassword;
        await user.save();

        await sendPasswordChangedEmail(user.email);

        res.json({ message: "Password changed successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// UPLOAD AVATAR
exports.uploadAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!req.file) return res.status(400).json({ message: "No image file uploaded" });

        if (user.avatar) {
            const oldPublicId = user.avatar.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy("paygo/avatars/" + oldPublicId);
        }

        user.avatar = req.file.path;
        await user.save();

        return res.json({
            message: "Avatar uploaded successfully",
            avatar: user.avatar,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};


// DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) return res.status(400).json({ message: "Password is required" });

        const user = await User.findById(userId).select("+password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

        await User.findByIdAndDelete(userId);

        await sendAccountDeletedEmail(user.email);

        return res.status(200).json({
            message: "Account deleted successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};
