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

app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));

// Binding to 0.0.0.0 is mandatory for Render
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
        IntentsBitField.Flags.MessageContent, 
        IntentsBitField.Flags.GuildInvites,
    ],
});

client.commands = new Collection();

/* ================================
    3. READY EVENT
================================ */
client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ================================
    4. COMMAND HANDLER
================================ */
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
});

/* ================================
    5. DATABASE & LOGIN
================================ */
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB: Connected");
        return client.login(process.env.TOKEN);
    })
    .catch((err) => {
        console.error("❌ Critical Startup Error:", err.message);
    });

// Anti-Crash
process.on('unhandledRejection', (error) => console.error('🔴 Rejection:', error));
process.on('uncaughtException', (error) => console.error('🔴 Exception:', error));