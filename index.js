require("dotenv/config");
const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");

// 1. EXPRESS SERVER (Render Health Check)
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));

app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Web server active on port ${port}`);
});

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

// 3. READY EVENT
client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    // Bina await ke commands clear karna
    client.application.commands.set([])
        .then(() => console.log("✅ Ghost commands cleared!"))
        .catch(err => console.error("❌ Clear error:", err));
});

// 4. COMMAND HANDLER (DJS-Commander automatically loads files)
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
});

// 5. DATABASE & LOGIN (Using .then for zero crashes)
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Database Connected.");
        return client.login(process.env.TOKEN);
    })
    .catch((err) => {
        console.error("❌ Connection/Login Error:", err);
    });