const { Schema, model } = require("mongoose");

const userProfileSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    lastDaily: { type: Number, default: 0 },
    // Naye Stats Fields
    withdrawals: { type: Number, default: 0 },
    withdrawCount: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    winAmount: { type: Number, default: 0 },
    wageredAmount: { type: Number, default: 0 },
    tipsSent: { type: Number, default: 0 },
    tipsReceived: { type: Number, default: 0 }
});

module.exports = model("UserProfile", userProfileSchema);