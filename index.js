require("dotenv/config");
const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");

// 1. EXPRESS SERVER (Health Check for Render)
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));
app.listen(port, "0.0.0.0", () => console.log(`✅ Port ${port} Active`));

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildInvites,
    ],
});

client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.application.commands.set([]).catch(() => {});
});

// 2. COMMAND HANDLER (Wrapped to prevent TLA crash)
try {
    new CommandHandler({
        client,
        eventsPath: path.join(__dirname, "events"),
        commandsPath: path.join(__dirname, "commands"),
    });
} catch (err) {
    console.error("❌ Command Loading Error:", err.message);
}

// 3. DATABASE & LOGIN
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Database Connected");
        client.login(process.env.TOKEN).catch(err => console.error("❌ Login Fail:", err));
    })
    .catch(err => console.error("❌ DB Fail:", err));