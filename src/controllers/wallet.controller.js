const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model"); 

exports.getWallet = async (req, res) => {
    const wallet = await Wallet.findOne({ user: req.user.id });

    res.json({
        balance: wallet.balance,
    });
};

exports.fundWallet = async (req, res) => {
    const { amount } = req.body;

    if (amount <= 0)
        return res.status(400).json({ message: "Invalid amount" });

    const wallet = await Wallet.findOne({ user: req.user.id });

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
        user: req.user.id,
        type: "credit",
        amount,
        description: "Manual funding (development mode)",
    });

    res.json({
        message: "Wallet funded",
        balance: wallet.balance,
    });
};

exports.transfer = async (req, res) => {
    const { recipientEmail, amount } = req.body; // <-- use recipientEmail

    if (amount <= 0)
        return res.status(400).json({ message: "Invalid amount" });

    const senderWallet = await Wallet.findOne({ user: req.user.id });

    // Case-insensitive lookup
    const receiverUser = await User.findOne({ email: new RegExp(`^${recipientEmail}$`, "i") });

    if (!receiverUser)
        return res.status(404).json({ message: "Receiver not found" });

    if (receiverUser._id.equals(req.user.id))
        return res.status(400).json({ message: "Cannot send to yourself" });

    const receiverWallet = await Wallet.findOne({ user: receiverUser._id });

    if (senderWallet.balance < amount)
        return res.status(400).json({ message: "Insufficient balance" });

    // Deduct sender
    senderWallet.balance -= amount;
    await senderWallet.save();

    // Add to receiver
    receiverWallet.balance += amount;
    await receiverWallet.save();

    // Log sender
    await Transaction.create({
        user: req.user.id,
        type: "debit",
        amount,
        description: `Transfer to ${recipientEmail}`,
    });

    // Log receiver
    await Transaction.create({
        user: receiverUser._id,
        type: "credit",
        amount,
        description: `Received from ${req.user.email}`,
    });

    res.json({ message: "Transfer successful" });
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 }); 

        res.json({
            count: transactions.length,
            transactions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

