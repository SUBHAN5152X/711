const { Schema, model } = require('mongoose');

const userProfileSchema = new Schema({
    userId: {
        type: String,
        require: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 2,
    },
    lastDailyCollected: {
        type: Date,
    },
});

module.exports = model('UserProfile', userProfileSchema);