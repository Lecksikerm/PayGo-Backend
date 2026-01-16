const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
