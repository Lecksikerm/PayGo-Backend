const Wallet = require("../models/wallet.model");
const bcrypt = require("bcryptjs");

exports.setPin = async (req, res) => {
    try {
        const { pin } = req.body;

        // Must be exactly 4 digits
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json({ message: "PIN must be exactly 4 digits" });
        }

        const wallet = await Wallet.findOne({ user: req.user.id });
        wallet.pin = pin;
        await wallet.save();

        res.json({ message: "Wallet PIN set successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ message: "PIN must be 4 digits" });
        }

        const wallet = await Wallet.findOne({ user: req.user.id }).select("+pin");

        if (!wallet || !wallet.pin) {
            return res.status(400).json({ message: "No PIN set for this wallet" });
        }

        const isMatch = await wallet.matchPin(pin);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect PIN" });
        }

        res.json({ message: "PIN verified successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

