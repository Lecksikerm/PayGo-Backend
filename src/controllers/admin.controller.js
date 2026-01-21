const User = require("../models/user.model");
const { 
    sendAccountSuspendedEmail, 
    sendAccountActivatedEmail, 
    sendAccountDeletedEmail 
} = require("../services/email.service");

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.suspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            { isSuspended: true },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        await sendAccountSuspendedEmail(user.email);

        res.json({ success: true, message: "User suspended" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ACTIVATE USER
exports.activateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            { isSuspended: false },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        await sendAccountActivatedEmail(user.email);

        res.json({ success: true, message: "User activated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        await sendAccountDeletedEmail(user.email);

        res.json({ success: true, message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

