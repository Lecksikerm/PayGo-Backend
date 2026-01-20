const User = require("../models/user.model");
const bcrypt = require("bcryptjs");


exports.getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
        message: "Profile fetched successfully",
        user
    });
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, address } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both old and new password are required" });
        }

        const user = await User.findById(req.user.id);

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const samePassword = await user.matchPassword(newPassword);
        if (samePassword) {
            return res.status(400).json({ message: "New password cannot be the same as the old password" });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


