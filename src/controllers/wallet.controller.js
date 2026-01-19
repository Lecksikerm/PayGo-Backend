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
    const { recipientEmail, amount, pin } = req.body;

    // Validate amount
    if (amount <= 0)
        return res.status(400).json({ message: "Invalid amount" });

    if (!pin || !/^\d{4}$/.test(pin))
        return res.status(400).json({ message: "A valid 4-digit PIN is required" });

    // Get sender wallet (with PIN selection)
    const senderWallet = await Wallet.findOne({ user: req.user.id }).select("+pin");

    if (!senderWallet.pin)
        return res.status(400).json({ message: "You must set a wallet PIN before making transfers" });

    // Check PIN
    const isMatch = await senderWallet.matchPin(pin);
    if (!isMatch)
        return res.status(400).json({ message: "Incorrect PIN" });

    // Get receiver
    const receiverUser = await User.findOne({
        email: new RegExp(`^${recipientEmail}$`, "i")
    });

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

    // Credit receiver
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
        const userId = req.user.id;

        let { page = 1, limit = 10, type, startDate, endDate, sort = "desc" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const filter = { user: userId };

        // Filter by type
        if (type && ["credit", "debit"].includes(type)) {
            filter.type = type;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        
        const sortOption = sort === "asc" ? 1 : -1;

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: sortOption })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Transaction.countDocuments(filter);

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            transactions
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const transaction = await Transaction.findOne({
            _id: id,
            user: userId
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({
            message: "Transaction retrieved successfully",
            transaction
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
