const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: "NGN"
    },

    pin: {
        type: String,
        select: false
    },

    pinAttempts: {
        type: Number,
        default: 0
    },

    pinLockedUntil: {
        type: Date,
        default: null
    }

}, { timestamps: true });


walletSchema.pre("save", async function () {
    if (!this.isModified("pin")) return;

    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
});


walletSchema.methods.matchPin = async function (enteredPin) {
    return await bcrypt.compare(enteredPin, this.pin);
};


module.exports = mongoose.model("Wallet", walletSchema);

