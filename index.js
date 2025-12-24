require("dotenv/config");

const { Client, IntentsBitField, Collection } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const PREFIX = process.env.PREFIX || "-";

/* ================================
    EXPRESS SERVER (For 24/7)
================================ */
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Bot is Online!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/* ================================
    CLIENT INITIALIZATION
================================ */
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.commands = new Collection(); // Map ki jagah Collection use karna better hai

/* ================================
    COMMAND LOADER (Prefix & Autocomplete)
================================ */
const commandsPath = path.join(__dirname, "commands");

function loadCommands(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadCommands(fullPath);
        } else if (file.name.endsWith(".js")) {
            const command = require(fullPath);
            if (command?.data?.name) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

loadCommands(commandsPath);

/* ================================
    INTERACTION HANDLER (Slash + Autocomplete)
================================ */
client.on("interactionCreate", async (interaction) => {
    // 1. Handle Autocomplete requests
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;

        try {
            await command.autocomplete({ interaction, client });
        } catch (error) {
            console.error("Autocomplete Error:", error);
        }
        return;
    }

    // 2. Chat Input Commands handled by djs-commander below
});

/* ================================
    PREFIX MESSAGE HANDLER
================================ */
client.on("messageCreate", async message => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.run({ message, args, client });
    } catch (error) {
        console.error("Prefix Command Error:", error);
        message.channel.send("❌ There was an error executing that command.");
    }
});

/* ================================
    COMMAND HANDLER (DJS-COMMANDER)
================================ */
new CommandHandler({
    client,
    eventsPath: path.join(__dirname, "events"),
    commandsPath: path.join(__dirname, "commands"),
    guildId: process.env.GUILD_ID,
});

/* ================================
    DATABASE + LOGIN
================================ */
(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to the database.");
        await client.login(process.env.TOKEN);
        console.log(`✅ Logged in as ${client.user.tag}`);
    } catch (error) {
        console.error("Login Error:", error);
    }
})();