const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const paystack = require("../services/paystack.service");
const {
    sendWalletFundedEmail,
    sendTransferSentEmail,
    sendTransferReceivedEmail
} = require("../services/email.service");
const mongoose = require("mongoose");
const crypto = require("crypto");
const {
    saveBeneficiaryFromTransfer,
} = require("../controllers/beneficiary.controller");


/**
 * GET WALLET BALANCE
 */
const getWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user.id });
        if (!wallet) return res.status(404).json({ message: "Wallet not found" });

        res.json({ balance: wallet.balance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * INIT PAYSTACK FUNDING
 */
const fundWalletPaystack = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (!amount || amount < 100)
            return res.status(400).json({ message: "Minimum funding is ₦100" });

        // Prevent duplicate pending transactions
        const pending = await Transaction.findOne({
            user: userId,
            type: "credit",
            status: "pending"
        });

        if (pending) {

            return res.status(200).json({
                status: true,
                message: "You have a pending transaction",
                authorization_url: pending.authorizationUrl,
                reference: pending.reference
            });
        }

        // Generate truly unique reference with timestamp and random
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const reference = `PAYGO_${userId}_${timestamp}_${random}`;

        // Initialize Paystack transaction
        const response = await paystack.post("/transaction/initialize", {
            email: req.user.email,
            amount: amount * 100,
            reference: reference,
            callback_url: `${process.env.FRONTEND_URL}/wallet/verify`,
            metadata: {
                userId,
                amount,
                timestamp
            }
        });

        const authorizationUrl = response.data.data.authorization_url;

        await Transaction.create({
            user: userId,
            type: "credit",
            amount,
            reference: reference,
            status: "pending",
            description: "Pending Paystack wallet funding",
            authorizationUrl: authorizationUrl
        });

        res.status(200).json({
            status: true,
            authorization_url: authorizationUrl,
            reference: reference,
            email: req.user.email
        });
    } catch (err) {
        console.error("Paystack Init Error:", err.response?.data || err);
        res.status(500).json({ message: "Unable to initialize payment" });
    }
};

/**
 * VERIFY PAYSTACK PAYMENT
 */
const verifyFunding = async (req, res) => {
    try {
        const { reference } = req.params;

        // Call Paystack API to verify
        const verify = await paystack.get(`/transaction/verify/${reference}`);
        const payment = verify.data.data;

        console.log("Paystack verify data:", payment);

        if (payment.status !== "success")
            return res.status(400).json({ message: "Payment not successful" });

        const userId = payment.metadata.userId;
        const creditedAmount = payment.amount / 100;

        const session = await mongoose.startSession();
        session.startTransaction();

        const tx = await Transaction.findOneAndUpdate(
            { reference, status: "pending" },
            { status: "successful" },
            { new: true, session }
        );

        if (!tx) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ status: "duplicate", message: "Payment already processed" });
        }

        // Update wallet
        const wallet = await Wallet.findOneAndUpdate(
            { user: userId },
            { $inc: { balance: creditedAmount } },
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        const user = await User.findById(userId);
        await sendWalletFundedEmail(user.email, creditedAmount, wallet.balance);

        res.status(200).json({
            message: "Wallet funded successfully",
            amount: creditedAmount,
            newBalance: wallet.balance
        });
    } catch (err) {
        console.error("Verify Funding Error:", err.response?.data || err);
        res.status(500).json({ message: "Verification failed" });
    }
};

/**
 * PAYSTACK WEBHOOK
 */
const paystackWebhook = async (req, res) => {
    try {
        const rawBody = req.body.toString();
        const signature = req.headers["x-paystack-signature"];

        const hash = crypto
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
            .update(rawBody)
            .digest("hex");

        if (hash !== signature) return res.status(401).send("Invalid signature");

        const event = JSON.parse(rawBody);

        if (event.event !== "charge.success") return res.status(200).send("Event ignored");

        const { reference, amount, metadata } = event.data;
        const userId = metadata.userId;
        const creditedAmount = amount / 100;

        const session = await mongoose.startSession();
        session.startTransaction();

        const tx = await Transaction.findOneAndUpdate(
            { reference, status: "pending" },
            { status: "successful" },
            { new: true, session }
        );

        if (!tx) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).send("Already processed");
        }

        const wallet = await Wallet.findOneAndUpdate(
            { user: userId },
            { $inc: { balance: creditedAmount } },
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        const user = await User.findById(userId);
        await sendWalletFundedEmail(user.email, creditedAmount, wallet.balance);

        res.status(200).send("OK");
    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(500).send("Webhook Error");
    }
};
/**
 * TRANSFER FUNDS
 */
const transfer = async (req, res) => {
    try {
        let { recipientEmail, amount, pin } = req.body;

        if (!amount || amount <= 0)
            return res.status(400).json({ message: "Invalid amount" });

        if (!pin || !/^\d{4}$/.test(pin))
            return res.status(400).json({ message: "A valid 4-digit PIN is required" });

        if (!recipientEmail)
            return res.status(400).json({ message: "Receiver email is required" });

        const email = recipientEmail.trim().toLowerCase();

        const sender = await User.findById(req.user.id).select("+walletPin");
        if (!sender.walletPin) {
            return res.status(400).json({ message: "Set a wallet PIN before transfers" });
        }

        const isMatch = await sender.matchPin(pin);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect PIN" });
        }

        const senderWallet = await Wallet.findOne({ user: req.user.id });
        if (!senderWallet) {
            return res.status(404).json({ message: "Sender wallet not found" });
        }

        const receiverUser = await User.findOne({ email });
        if (!receiverUser)
            return res.status(404).json({ message: "Receiver not found" });

        if (receiverUser._id.equals(req.user.id))
            return res.status(400).json({ message: "Cannot send to yourself" });

        let receiverWallet = await Wallet.findOne({ user: receiverUser._id });
        if (!receiverWallet)
            receiverWallet = await Wallet.create({ user: receiverUser._id, balance: 0 });

        if (senderWallet.balance < amount)
            return res.status(400).json({ message: "Insufficient balance" });

        // Perform transfer
        senderWallet.balance -= amount;
        receiverWallet.balance += amount;

        await senderWallet.save();
        await receiverWallet.save();

        await Transaction.create({
            user: req.user.id,
            type: "debit",
            amount,
            description: `Transfer to ${email}`
        });

        await Transaction.create({
            user: receiverUser._id,
            type: "credit",
            amount,
            description: `Received from ${req.user.email}`
        });

        await saveBeneficiaryFromTransfer(req.user.id, receiverUser);

        // ========== SEND EMAIL NOTIFICATIONS (Fire and Forget) ==========
        const senderName = `${sender.firstName} ${sender.lastName}`;
        const receiverName = `${receiverUser.firstName} ${receiverUser.lastName}`;

        sendTransferSentEmail(
            sender.email,
            receiverName,
            amount,
            senderWallet.balance
        ).catch(err => console.error("Sender email failed:", err));

        sendTransferReceivedEmail(
            receiverUser.email,
            senderName,
            amount,
            receiverWallet.balance
        ).catch(err => console.error("Receiver email failed:", err));
       
        res.json({
            message: "Transfer successful",
            newBalance: senderWallet.balance
        });
    } catch (err) {
        console.error("Transfer Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET TRANSACTIONS (Paginated)
 */
const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        let { page = 1, limit = 10, type, startDate, endDate, sort = "desc" } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const filter = { user: userId };

        if (type && ["credit", "debit"].includes(type))
            filter.type = type;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate + "T00:00:00Z");
            if (endDate) filter.createdAt.$lte = new Date(endDate + "T23:59:59Z");
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

/**
 * GET TRANSACTION BY ID
 */
const getTransactionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const tx = await Transaction.findOne({ _id: id, user: userId });

        if (!tx)
            return res.status(404).json({ message: "Transaction not found" });

        res.json({ transaction: tx });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getWallet,
    fundWalletPaystack,
    verifyFunding,
    paystackWebhook,
    transfer,
    getTransactions,
    getTransactionById
};