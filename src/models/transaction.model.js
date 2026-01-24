const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        reference: {
            type: String,
            unique: true,
            sparse: true,
        },
        status: {
            type: String,
            enum: ["successful", "failed", "pending"],
            default: "successful",
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);


module.exports = mongoose.model("Transaction", transactionSchema);


