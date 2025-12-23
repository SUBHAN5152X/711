require("dotenv/config");

const { Client, IntentsBitField } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const PREFIX = process.env.PREFIX || "-";

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

/* ================================
   PREFIX COMMAND LOADER (SAFE)
================================ */

client.commands = new Map();

const commandsPath = path.join(__dirname, "commands");
const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

for (const entry of entries) {
    // commands/ping.js, commands/rules.js
    if (entry.isFile() && entry.name.endsWith(".js")) {
        const command = require(path.join(commandsPath, entry.name));
        if (command?.data?.name) {
            client.commands.set(command.data.name, command);
        }
    }

    // commands/economy/balance.js, commands/admin/set-prefix.js
    if (entry.isDirectory()) {
        const folderPath = path.join(commandsPath, entry.name);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

        for (const file of files) {
            const command = require(path.join(folderPath, file));
            if (command?.data?.name) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

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
        console.error(error);
        message.channel.send("There was an error executing that command.");
    }
});

/* ================================
   SLASH COMMAND HANDLER
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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to the database.");
    await client.login(process.env.TOKEN);
})();
