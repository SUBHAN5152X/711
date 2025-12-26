require("dotenv/config");
const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");
const express = require('express');

/* ================================
    1. WEB SERVER (Render Port Fix)
================================ */
const app = express();
const PORT = process.env.PORT || 10000;

// Render needs a 200 OK response to mark the service as "Live"
app.get('/', (req, res) => {
    res.status(200).send('711 Bet Bot is Live and Healthy!');
});

// Binding to 0.0.0.0 is mandatory for Render to detect the port
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Health check active on port ${PORT}`);
});

/* ================================
    2. CLIENT SETUP
================================ */
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent, // ⚠️ Ensure this is ON in Dev Portal
        IntentsBitField.Flags.GuildInvites,
    ],
});

client.commands = new Collection();

/* ================================
    3. COMMAND HANDLER
=============================== */
// Initialize before login to ensure events/commands are ready
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
});
console.log("📂 Command handler initialized.");

/* ================================
    4. DATABASE & LOGIN
================================ */
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Database Connection: SUCCESS");
        return client.login(process.env.TOKEN);
    })
    .then(() => {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log("🚀 Bot is fully operational.");
    })
    .catch((err) => {
        console.error("❌ Critical Startup Error:", err.message);
    });

/* ================================
    5. ANTI-CRASH SYSTEM
================================ */
process.on('unhandledRejection', (error) => {
    console.error('🔴 Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('🔴 Uncaught Exception:', error);
});