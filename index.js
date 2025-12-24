require("dotenv/config");
const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");
const Giveaway = require("./schemas/Giveaway");
const UserProfile = require("./schemas/UserProfile");

const PREFIX = process.env.PREFIX || "-";
const invites = new Map();

/* ================================
    1. EXPRESS SERVER (Render Fix)
================================ */
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));

// Render ko pehle port milna chahiye
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Web server active on port ${port}`);
});

/* ================================
    2. BOT INITIALIZATION
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

const RESTRICTED_CHANNELS = [
    "1453274442548514860", // General
    "1453327792119742524"  // Media
];

/* ================================
    3. EVENTS
================================ */
client.on("ready", async () => {
    try {
        // Ghost commands ko function ke andar clear kar rahe hain
        await client.application.commands.set([]); 
        console.log("✅ Commands refreshed successfully!");
    } catch (error) {
        console.error("Cleanup error:", error);
    }
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ... (Baqi Interaction/Invite logic same rahega)

/* ================================
    4. STARTUP FUNCTION (CRASH FIX)
================================ */
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
    guildId: process.env.GUILD_ID,
});

async function startBot() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Database Connected.");
        
        // Login await yahan safe hai
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error("❌ Startup Error:", error);
        process.exit(1); // Error aane par restart karega
    }
}

// Global scope mein bina await ke call karein
startBot();