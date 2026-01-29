/*  wallet.controller.js  */
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const Notification = require("../models/notification.model");   // ← NEW
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


const getWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user.id });
        if (!wallet) return res.status(404).json({ message: "Wallet not found" });
        res.json({ balance: wallet.balance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const fundWalletPaystack = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        if (!amount || amount < 100)
            return res.status(400).json({ message: "Minimum funding is ₦100" });

        const pending = await Transaction.findOne({
            user: userId,
            type: "credit",
            status: "pending",
        });
        if (pending) {
            return res.status(200).json({
                status: true,
                message: "You have a pending transaction",
                authorization_url: pending.authorizationUrl,
                reference: pending.reference,
            });
        }

        const reference = `PAYGO_${userId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const response = await paystack.post("/transaction/initialize", {
            email: req.user.email,
            amount: amount * 100,
            reference,
            callback_url: `${process.env.FRONTEND_URL}/wallet/verify`,
            metadata: { userId, amount },
        });

        const authorizationUrl = response.data.data.authorization_url;
        await Transaction.create({
            user: userId,
            type: "credit",
            amount,
            reference,
            status: "pending",
            description: "Pending Paystack wallet funding",
            authorizationUrl,
        });

        res.status(200).json({
            status: true,
            authorization_url: authorizationUrl,
            reference,
            email: req.user.email,
        });
    } catch (err) {
        console.error("Paystack Init Error:", err);
        res.status(500).json({ message: "Unable to initialize payment" });
    }
};

const verifyFunding = async (req, res) => {
    try {
        const { reference } = req.params;
        const verify = await paystack.get(`/transaction/verify/${reference}`);
        const payment = verify.data.data;

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
            await session.abortTransaction(); session.endSession();
            return res.json({ status: "duplicate", message: "Payment already processed" });
        }

        const wallet = await Wallet.findOneAndUpdate(
            { user: userId },
            { $inc: { balance: creditedAmount } },
            { new: true, session }
        );

        /* ===== NOTIFY USER ===== */
        await Notification.create([{
            user: userId,
            title: 'Wallet funded',
            message: `Your wallet has been credited with ₦${creditedAmount}`,
            type: 'credit',
            read: false
        }], { session });

        await session.commitTransaction(); session.endSession();

        const user = await User.findById(userId);
        sendWalletFundedEmail(user.email, creditedAmount, wallet.balance).catch(() => { });

        res.status(200).json({
            message: "Wallet funded successfully",
            amount: creditedAmount,
            newBalance: wallet.balance,
        });
    } catch (err) {
        res.status(500).json({ message: "Verification failed" });
    }
};


const paystackWebhook = async (req, res) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const hash = crypto
            .createHmac("sha512", secret)
            .update(JSON.stringify(req.body))
            .digest("hex");
        if (hash !== req.headers["x-paystack-signature"]) return res.sendStatus(401);

        const event = req.body;
        if (event.event === "charge.success") {
            const { reference, amount, metadata } = event.data;
            const existingTx = await Transaction.findOne({ reference });
            if (existingTx?.status === "successful") return res.sendStatus(200);

            const userId = metadata?.userId;
            if (!userId) return res.sendStatus(200);

            const session = await mongoose.startSession();
            session.startTransaction();

            await Transaction.findOneAndUpdate(
                { reference },
                { status: "successful" },
                { session }
            );
            await Wallet.findOneAndUpdate(
                { user: userId },
                { $inc: { balance: amount / 100 } },
                { session }
            );

            /* ===== NOTIFY USER ===== */
            await Notification.create([{
                user: userId,
                title: 'Wallet funded',
                message: `Your wallet has been credited with ₦${amount / 100}`,
                type: 'credit',
                read: false
            }], { session });

            await session.commitTransaction(); session.endSession();
        }
        res.sendStatus(200);
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.sendStatus(200);
    }
};


const transfer = async (req, res) => {
    try {
        const { recipientEmail, amount, pin } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
        if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ message: "A valid 4-digit PIN is required" });
        if (!recipientEmail) return res.status(400).json({ message: "Receiver email is required" });

        const email = recipientEmail.trim().toLowerCase();
        const sender = await User.findById(req.user.id).select("+walletPin");
        if (!sender.walletPin) return res.status(400).json({ message: "Set a wallet PIN before transfers" });

        const isMatch = await sender.matchPin(pin);
        if (!isMatch) return res.status(400).json({ message: "Incorrect PIN" });

        const senderWallet = await Wallet.findOne({ user: req.user.id });
        if (!senderWallet) return res.status(404).json({ message: "Sender wallet not found" });

        const receiverUser = await User.findOne({ email });
        if (!receiverUser) return res.status(404).json({ message: "Receiver not found" });
        if (receiverUser._id.equals(req.user.id)) return res.status(400).json({ message: "Cannot send to yourself" });

        let receiverWallet = await Wallet.findOne({ user: receiverUser._id });
        if (!receiverWallet) receiverWallet = await Wallet.create({ user: receiverUser._id, balance: 0 });

        if (senderWallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

        const senderName = `${sender.firstName} ${sender.lastName}`;
        const receiverName = `${receiverUser.firstName} ${receiverUser.lastName}`;
        const baseRef = `TRF_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        const debitRef = `${baseRef}_DB`;
        const creditRef = `${baseRef}_CR`;

        const session = await mongoose.startSession();
        session.startTransaction();

        /* 1.  move money */
        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
        await senderWallet.save({ session });
        await receiverWallet.save({ session });

        /* 2.  record transactions */
        const debitTransaction = await Transaction.create([{
            user: req.user.id,
            type: "debit",
            amount,
            reference: debitRef,
            status: "successful",
            description: `Transfer to ${receiverName}`,
            recipientInfo: { userId: receiverUser._id, name: receiverName, email }
        }], { session });

        await Transaction.create([{
            user: receiverUser._id,
            type: "credit",
            amount,
            reference: creditRef,
            status: "successful",
            description: `Received from ${senderName}`,
            senderInfo: { userId: sender._id, name: senderName, email: sender.email }
        }], { session });

        /* 3.  notifications  →  SENDER  */
        await Notification.create([{
            user: req.user.id,
            title: 'Money sent',
            message: `You transferred ₦${amount} to ${receiverName} (${email})`,
            type: 'debit',
            read: false
        }], { session });

        /* 4.  notifications  →  RECEIVER  */
        await Notification.create([{
            user: receiverUser._id,
            title: 'Money received',
            message: `You received ₦${amount} from ${senderName} (${sender.email})`,
            type: 'credit',
            read: false
        }], { session });

        await session.commitTransaction();
        session.endSession();

        await saveBeneficiaryFromTransfer(req.user.id, receiverUser);

        sendTransferSentEmail(sender.email, receiverName, amount, senderWallet.balance).catch(() => { });
        sendTransferReceivedEmail(receiverUser.email, senderName, amount, receiverWallet.balance).catch(() => { });

        res.json({
            message: "Transfer successful",
            newBalance: senderWallet.balance,
            transaction: {
                reference: debitTransaction[0].reference,
                amount: debitTransaction[0].amount,
                recipientEmail: email,
                createdAt: debitTransaction[0].createdAt,
                status: debitTransaction[0].status
            }
        });
    } catch (err) {
        console.error("Transfer Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const transactions = await Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Transaction.countDocuments({ user: userId });
        res.json({ page: Number(page), limit: Number(limit), total, transactions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });
        res.json({ transaction });
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
