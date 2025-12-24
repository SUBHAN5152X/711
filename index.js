require("dotenv/config");
const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");

const PREFIX = process.env.PREFIX || "-";

// 1. EXPRESS SERVER (Render Health Check)
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));
app.listen(port, "0.0.0.0", () => console.log(`✅ Port ${port} Active`));

// 2. CLIENT SETUP
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

// 3. READY EVENT (Safe Cleanup)
client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    // Commands clear karne ke liye await ko .then() mein daal diya taaki TLA error na aaye
    client.application.commands.set([])
        .then(() => console.log("✅ Commands Refreshed"))
        .catch(err => console.error("❌ Cleanup Error:", err));
});

// 4. COMMAND HANDLER
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
});

// 5. DATABASE & LOGIN (Using standard .then instead of await)
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Database Connected");
        return client.login(process.env.TOKEN);
    })
    .catch(err => {
        console.error("❌ Startup Error:", err);
    });