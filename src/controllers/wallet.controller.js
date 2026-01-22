const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const paystack = require("../services/paystack.service");
const { sendWalletFundedEmail } = require("../services/email.service");
const crypto = require("crypto");


exports.getWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user.id });
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found" });

        res.json({ balance: wallet.balance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.fundWalletManual = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0)
            return res.status(400).json({ message: "Invalid amount" });

        const wallet = await Wallet.findOne({ user: req.user.id });
        wallet.balance += amount;
        await wallet.save();

        await Transaction.create({
            user: req.user.id,
            type: "credit",
            amount,
            description: "Manual wallet funding (development mode)",
        });

        await sendWalletFundedEmail(req.user.email, amount);

        res.json({
            message: "Wallet funded (manual)",
            balance: wallet.balance,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.fundWalletPaystack = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount < 100)
            return res
                .status(400)
                .json({ message: "Minimum funding is ₦100" });

        const user = req.user;

        const response = await paystack.post("/transaction/initialize", {
            email: user.email,
            amount: amount * 100,
            callback_url: `${process.env.BACKEND_URL}/wallet/verify`,
            metadata: {
                userId: user._id.toString(),
            },
        });

        res.status(200).json({
            status: true,
            authorization_url: response.data.data.authorization_url,
            reference: response.data.data.reference,
        });
    } catch (err) {
        console.log(err.response?.data || err);
        res.status(500).json({ message: "Unable to initialize payment" });
    }
};

exports.verifyFunding = async (req, res) => {
    try {
        const { reference } = req.params;

        const verify = await paystack.get(`/transaction/verify/${reference}`);
        const data = verify.data.data;

        if (data.status !== "success")
            return res.status(400).json({ message: "Payment not successful" });

        const userId = data.metadata.userId;
        const amount = data.amount / 100;

        const wallet = await Wallet.findOne({ user: userId });
        wallet.balance += amount;
        await wallet.save();

        await Transaction.create({
            user: userId,
            type: "credit",
            amount,
            reference,
            status: "successful",
            description: "Wallet funded via Paystack",
        });

        const user = await User.findById(userId);

        await sendWalletFundedEmail(user.email, amount);

        res.status(200).json({
            message: "Wallet funded successfully",
            amount,
            newBalance: wallet.balance,
        });
    } catch (err) {
        console.log(err.response?.data || err);
        res.status(500).json({ message: "Verification failed" });
    }
};

exports.paystackWebhook = async (req, res) => {
    try {
        const rawBody = req.body.toString(); 
        const signature = req.headers["x-paystack-signature"];

        const hash = crypto
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
            .update(rawBody)
            .digest("hex");

        if (hash !== signature) return res.status(401).send("Invalid signature");

        const event = JSON.parse(rawBody); 

        if (event.event !== "charge.success") return res.status(200).send("Ignored");

        const data = event.data;
        const userId = data.metadata.userId;
        const amount = data.amount / 100;
        const reference = data.reference;

        const exists = await Transaction.findOne({ reference });
        if (exists) return res.status(200).send("Already processed");

        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) return res.status(404).send("Wallet not found");

        wallet.balance += amount;
        await wallet.save();

        await Transaction.create({
            user: userId,
            type: "credit",
            amount,
            reference,
            status: "successful",
            description: "Auto-funded via Paystack webhook",
        });

        const user = await User.findById(userId);
        await sendWalletFundedEmail(user.email, amount, wallet.balance);

        res.status(200).send("OK");
    } catch (err) {
        console.error("Webhook error:", err);
        res.status(500).send("Webhook Error");
    }
};

exports.transfer = async (req, res) => {
    try {
        const { recipientEmail, amount, pin } = req.body;

        if (!amount || amount <= 0)
            return res.status(400).json({ message: "Invalid amount" });

        if (!pin || !/^\d{4}$/.test(pin))
            return res
                .status(400)
                .json({ message: "A valid 4-digit PIN is required" });

        const senderWallet = await Wallet.findOne({ user: req.user.id }).select(
            "+pin"
        );
        if (!senderWallet.pin)
            return res
                .status(400)
                .json({ message: "Set a wallet PIN before transfers" });

        const isMatch = await senderWallet.matchPin(pin);
        if (!isMatch)
            return res.status(400).json({ message: "Incorrect PIN" });

        const receiverUser = await User.findOne({
            email: new RegExp(`^${recipientEmail}$`, "i"),
        });

        if (!receiverUser)
            return res.status(404).json({ message: "Receiver not found" });

        if (receiverUser._id.equals(req.user.id))
            return res
                .status(400)
                .json({ message: "Cannot send to yourself" });

        const receiverWallet = await Wallet.findOne({
            user: receiverUser._id,
        });

        if (senderWallet.balance < amount)
            return res
                .status(400)
                .json({ message: "Insufficient balance" });

        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
        await senderWallet.save();
        await receiverWallet.save();

        await Transaction.create({
            user: req.user.id,
            type: "debit",
            amount,
            description: `Transfer to ${recipientEmail}`,
        });

        await Transaction.create({
            user: receiverUser._id,
            type: "credit",
            amount,
            description: `Received from ${req.user.email}`,
        });

        res.json({ message: "Transfer successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =============================
// LIST TRANSACTIONS
// =============================
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        let {
            page = 1,
            limit = 10,
            type,
            startDate,
            endDate,
            sort = "desc",
        } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const filter = { user: userId };

        if (type && ["credit", "debit"].includes(type)) filter.type = type;

        if (startDate || endDate) filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate + "T00:00:00Z");
        if (endDate) filter.createdAt.$lte = new Date(endDate + "T23:59:59Z");

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
            transactions,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// =============================
// GET SINGLE TRANSACTION
// =============================
exports.getTransactionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const transaction = await Transaction.findOne({
            _id: id,
            user: userId,
        });

        if (!transaction)
            return res
                .status(404)
                .json({ message: "Transaction not found" });

        res.json({
            message: "Transaction retrieved successfully",
            transaction,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


