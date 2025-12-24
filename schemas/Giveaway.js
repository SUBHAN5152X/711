const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema({
    messageId: String,
    channelId: String,
    guildId: String,
    prize: String,
    winnerCount: Number,
    endTime: Date,
    hostedBy: String,
    participants: [String],
    ended: { type: Boolean, default: false }
});

module.exports = mongoose.model("Giveaway", giveawaySchema);