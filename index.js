require("dotenv/config");
const { Client, IntentsBitField, Collection, EmbedBuilder } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const path = require("path");
const Giveaway = require("./schemas/Giveaway");
const UserProfile = require("./schemas/UserProfile");

const PREFIX = process.env.PREFIX || "-";
const invites = new Map();

/* ================================
    1. EXPRESS SERVER (Fast Deploy)
================================ */
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('711 Bet Bot is Live!'));

// Render ko port detection mein delay na ho isliye ise pehle run kar rahe hain
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Web server active on port ${port}`);
});

/* ================================
    2. BOT SETUP
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
    3. CHANNEL & READY LOGIC
================================ */
const RESTRICTED_CHANNELS = [
    "1453274442548514860", // General Chat
    "1453327792119742524"  // Media
];

client.on("ready", async () => {
    try {
        console.log("🔄 Cleaning ghost commands...");
        await client.application.commands.set([]); 
        console.log("✅ Commands refreshed!");
    } catch (error) {
        console.error("Cleanup error:", error);
    }

    client.guilds.cache.forEach(async (guild) => {
        try {
            const firstInvites = await guild.invites.fetch();
            invites.set(guild.id, new Map(firstInvites.map((inv) => [inv.code, inv.uses])));
        } catch (err) {
            console.log(`❌ Invite Cache Error: ${err.message}`);
        }
    });
    console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ================================
    4. INTERACTION & INVITE LOGIC
================================ */
client.on("guildMemberAdd", async (member) => {
    try {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invites.get(member.guild.id);
        const invite = newInvites.find((i) => i.uses > (oldInvites?.get(i.code) || 0));

        if (invite) {
            await UserProfile.findOneAndUpdate(
                { userId: invite.inviter.id },
                { $inc: { invites: 1 } },
                { upsert: true }
            );
            await UserProfile.findOneAndUpdate(
                { userId: member.id },
                { inviterId: invite.inviter.id },
                { upsert: true }
            );
        }
        invites.set(member.guild.id, new Map(newInvites.map((inv) => [inv.code, inv.uses])));
    } catch (err) {
        console.error("Invite Error:", err);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (RESTRICTED_CHANNELS.includes(interaction.channelId)) {
            return interaction.reply({ content: "❌ Commands disabled here!", flags: [64] });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "ga_join") {
            const data = await Giveaway.findOne({ messageId: interaction.message.id });
            if (!data || data.ended) return interaction.reply({ content: "❌ Ended!", flags: [64] });
            if (data.participants.includes(interaction.user.id)) return interaction.reply({ content: "❌ Already joined!", flags: [64] });
            data.participants.push(interaction.user.id);
            await data.save();
            return interaction.reply({ content: "✅ Joined!", flags: [64] });
        }

        if (interaction.customId === "verify_btn") {
            const roleId = "1453285948581216356";
            if (Date.now() - interaction.user.createdTimestamp < 60 * 24 * 60 * 60 * 1000) {
                return interaction.reply({ content: "❌ Account too new!", flags: [64] });
            }
            try {
                await interaction.member.roles.add(roleId);
                return interaction.reply({ content: "✅ Verified!", flags: [64] });
            } catch (err) {
                return interaction.reply({ content: "❌ Hierarchy Error!", flags: [64] });
            }
        }
    }
});

/* ================================
    5. STARTUP (The Fix)
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
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error("Startup Error:", error);
    }
}

startBot();