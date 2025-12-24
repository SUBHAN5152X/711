require("dotenv/config");

const { Client, IntentsBitField, Collection, EmbedBuilder } = require("discord.js");
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
  res.send('711 Bet Bot is Online!');
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

client.commands = new Collection();

/* ================================
    COMMAND LOADER
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
    INTERACTION HANDLER
================================ */
client.on("interactionCreate", async (interaction) => {
    
    // 1. Handle Autocomplete requests (For /delete-code etc.)
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

    // 2. Handle Verification Button (Anti-Alt Logic)
    if (interaction.isButton() && interaction.customId === "verify_btn") {
        const member = interaction.member;
        const roleId = "1453285948581216356"; // Teri di hui Role ID
        const sixtyDays = 60 * 24 * 60 * 60 * 1000; // 60 Din milliseconds mein
        const accountAge = Date.now() - member.user.createdTimestamp;

        // Check if account is older than 60 days
        if (accountAge < sixtyDays) {
            const remainingDays = Math.ceil((sixtyDays - accountAge) / (1000 * 60 * 60 * 24));
            return interaction.reply({ 
                content: `❌ **Verification Failed:** Your account must be at least **60 days old**. Please try again in **${remainingDays} days**.`, 
                flags: [64] 
            });
        }

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: "❌ Error: Verified role not found. Contact Admin.", flags: [64] });

        try {
            await member.roles.add(role);
            return interaction.reply({ 
                content: "✅ **Success:** Your account is verified! You now have full access to the server.", 
                flags: [64] 
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({ 
                content: "❌ **Permission Error:** Make sure my bot role is **ABOVE** the 'Verified' role in Server Settings.", 
                flags: [64] 
            });
        }
    }
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
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to the database.");
        
        await client.login(process.env.TOKEN);
        console.log(`✅ Logged in as ${client.user.tag}`);
    } catch (error) {
        console.error("Login Error:", error);
    }
})();