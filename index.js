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
    EXPRESS SERVER (For Render 24/7)
================================ */
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('711 Bet Bot is Online!'));
app.listen(port, () => console.log(`✅ Web server active on port ${port}`));

/* ================================
    CHANNEL CONFIGURATION
================================ */
const RESTRICTED_CHANNELS = [
    "1453274442548514860", // General Chat ID
    "1453327792119742524"  // Media ID
];

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
    READY EVENT (Cleanup & Invites)
================================ */
client.on("ready", async () => {
    try {
        console.log("🔄 Refreshing global slash commands...");
        // Clearing ghost commands safely inside ready event
        await client.application.commands.set([]); 
        console.log("✅ Ghost commands cleared from Discord!");
    } catch (error) {
        console.error("Cleanup error:", error);
    }

    client.guilds.cache.forEach(async (guild) => {
        try {
            const firstInvites = await guild.invites.fetch();
            invites.set(guild.id, new Map(firstInvites.map((inv) => [inv.code, inv.uses])));
            console.log(`✅ Cached invites for: ${guild.name}`);
        } catch (err) {
            console.log(`❌ Invite Cache Error: ${err.message}`);
        }
    });
    console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ================================
    INVITE TRACKER
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
        console.error("Invite Track Error:", err);
    }
});

/* ================================
    INTERACTION HANDLER
================================ */
client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete({ interaction, client });
        return;
    }

    if (interaction.isChatInputCommand()) {
        if (RESTRICTED_CHANNELS.includes(interaction.channelId)) {
            return interaction.reply({ 
                content: "❌ Commands are disabled here. Please use the Game Rooms.", 
                flags: [64] 
            });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "ga_join") {
            const data = await Giveaway.findOne({ messageId: interaction.message.id });
            if (!data || data.ended) return interaction.reply({ content: "❌ This giveaway has ended!", flags: [64] });
            if (data.participants.includes(interaction.user.id)) return interaction.reply({ content: "❌ Already joined!", flags: [64] });

            data.participants.push(interaction.user.id);
            await data.save();
            return interaction.reply({ content: "✅ Successfully joined!", flags: [64] });
        }

        if (interaction.customId === "verify_btn") {
            const roleId = "1453285948581216356";
            const sixtyDays = 60 * 24 * 60 * 60 * 1000;
            const accountAge = Date.now() - interaction.member.user.createdTimestamp;

            if (accountAge < sixtyDays) return interaction.reply({ content: "❌ Account must be 60 days old.", flags: [64] });

            try {
                const role = interaction.guild.roles.cache.get(roleId);
                await interaction.member.roles.add(role);
                return interaction.reply({ content: "✅ Verification successful!", flags: [64] });
            } catch (err) {
                return interaction.reply({ content: "❌ Role Hierarchy Error.", flags: [64] });
            }
        }
    }
});

/* ================================
    GIVEAWAY MANAGER
================================ */
async function checkGiveaways() {
    try {
        const now = new Date();
        const endedGiveaways = await Giveaway.find({ ended: false, endTime: { $lte: now } });
        for (const data of endedGiveaways) {
            data.ended = true;
            await data.save();
            // Logic to pick winner goes here
        }
    } catch (err) {
        console.error("Giveaway Check Error:", err);
    }
}

/* ================================
    STARTUP LOGIC (Fixes ESM/Require Crash)
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
        setInterval(checkGiveaways, 30000); 
    } catch (error) {
        console.error("Startup Error:", error);
    }
}

startBot();