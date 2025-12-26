require("dotenv/config");
const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");

/* ================================
    1. WEB SERVER (Render 24/7 Fix)
================================ */
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));

app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Health check port ${port} is active.`);
});

/* ================================
    2. CLIENT SETUP
================================ */
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent, // ⚠️ Developer Portal par ON hona zaroori hai
        IntentsBitField.Flags.GuildInvites,
    ],
});

client.commands = new Collection();

/* ================================
    3. READY EVENT
================================ */
client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log("🚀 Bot is online and ready to accept commands.");
});

/* ================================
    4. COMMAND HANDLER
================================ */
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
});
console.log("📂 Command handler initialized.");

/* ================================
    5. DATABASE & STARTUP
================================ */
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Database Connection: SUCCESS");
        return client.login(process.env.TOKEN);
    })
    .catch((err) => {
        console.error("❌ Startup Failed:", err.message);
    });

/* ================================
    6. ANTI-CRASH SYSTEM
================================ */
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔴 Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('🔴 Uncaught Exception:', err);
});