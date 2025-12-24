const { Schema, model } = require("mongoose");

const codeSchema = new Schema({
    code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, default: 0 },
    createdBy: { type: String, required: true },
    redeemedBy: { type: [String], default: [] },
    expiresAt: { type: Date, default: null },
    allowedRoleId: { type: String, default: null },
    allowedRoles: { type: [String], default: [] }, // store role IDs
});

module.exports = model("Code", codeSchema);
