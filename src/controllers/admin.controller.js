const User = require("../models/user.model");


exports.getAllUsers = async (req, res) => {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
};

exports.suspendUser = async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { isSuspended: true });
    res.json({ success: true, message: "User suspended" });
};

exports.activateUser = async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { isSuspended: false });
    res.json({ success: true, message: "User activated" });
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted" });
};
