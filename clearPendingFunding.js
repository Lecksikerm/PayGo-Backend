// clearPendingFunding.js
require("dotenv").config();
const mongoose = require("mongoose");
const Transaction = require("./src/models/transaction.model");

// Connect to MongoDB (no extra options needed in Mongoose 7+)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

async function clearPendingFunding() {
    try {
        const result = await Transaction.updateMany(
            { status: "pending", type: "credit" },
            { $set: { status: "failed", description: "Canceled pending transaction for testing" } }
        );

        console.log(`✅ Cleared ${result.modifiedCount} pending funding transaction(s).`);
    } catch (err) {
        console.error("Error clearing pending transactions:", err);
    } finally {
        mongoose.connection.close();
    }
}

clearPendingFunding();
