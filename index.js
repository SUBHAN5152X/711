require("dotenv/config");
const { Client, IntentsBitField, Collection, EmbedBuilder } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Giveaway = require("./schemas/Giveaway");
const UserProfile = require("./schemas/UserProfile"); // Ensure path is correct

const PREFIX = process.env.PREFIX || "-";
const invites = new Map(); // Global map for tracking

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildInvites, // Added for invite tracking
    ],
});

client.commands = new Collection();

/* ================================
    INVITE TRACKER LOGIC
================================ */
client.on("ready", async () => {
    // Cache all invites for each guild
    client.guilds.cache.forEach(async (guild) => {
        try {
            const firstInvites = await guild.invites.fetch();
            invites.set(guild.id, new Map(firstInvites.map((inv) => [inv.code, inv.uses])));
            console.log(`✅ Cached ${firstInvites.size} invites for: ${guild.name}`);
        } catch (err) {
            console.log(`❌ Invite Cache Error for ${guild.name}:`, err.message);
        }
    });
});

client.on("guildMemberAdd", async (member) => {
    try {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invites.get(member.guild.id);
        const invite = newInvites.find((i) => i.uses > oldInvites.get(i.code));

        if (invite) {
            // Update Database: Increment inviter's count and save inviter ID for the new member
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
        // Refresh cache
        invites.set(member.guild.id, new Map(newInvites.map((inv) => [inv.code, inv.uses])));
    } catch (err) {
        console.error("Member Join Invite Track Error:", err);
    }
});

/* ================================
    GIVEAWAY AUTO-END CHECKER
================================ */
async function checkGiveaways() {
    const now = new Date();
    const endedGiveaways = await Giveaway.find({ ended: false, endTime: { $lte: now } });

    for (const data of endedGiveaways) {
        try {
            const channel = await client.channels.fetch(data.channelId);
            const msg = await channel.messages.fetch(data.messageId);
            await endGiveawayLogic(client, data, msg);
        } catch (err) {
            data.ended = true; 
            await data.save();
        }
    }
}

async function endGiveawayLogic(client, data, msg) {
    if (data.participants.length === 0) {
        data.ended = true;
        await data.save();
        return msg.edit({ content: "❌ Giveaway Ended: No participants.", embeds: [], components: [] });
    }

    const winners = [];
    const tempParticipants = [...data.participants];
    for (let i = 0; i < Math.min(data.winnerCount, tempParticipants.length); i++) {
        const randomIndex = Math.floor(Math.random() * tempParticipants.length);
        winners.push(`<@${tempParticipants.splice(randomIndex, 1)[0]}>`);
    }

    const endEmbed = new EmbedBuilder()
        .setTitle("🎁 Giveaway Ended")
        .setDescription(`**Prize:** ${data.prize}\n**Winners:** ${winners.join(", ")}\n**Host:** <@${data.hostedBy}>`)
        .setColor("#2b2d31")
        .setTimestamp();

    await msg.edit({ embeds: [endEmbed], components: [] });
    await msg.channel.send(`🎊 Congratulations ${winners.join(", ")}! You won **${data.prize}**!`);
    data.ended = true;
    await data.save();
}

/* ================================
    INTERACTION HANDLER
================================ */
client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete({ interaction, client });
        return;
    }

    if (interaction.isButton()) {
        if (interaction.customId === "ga_join") {
            const data = await Giveaway.findOne({ messageId: interaction.message.id });
            if (!data || data.ended) return interaction.reply({ content: "❌ Ye giveaway khatam ho chuka hai!", flags: [64] });
            if (data.participants.includes(interaction.user.id)) return interaction.reply({ content: "❌ Aap pehle hi join kar chuke ho!", flags: [64] });

            data.participants.push(interaction.user.id);
            await data.save();
            return interaction.reply({ content: "✅ Joined successfully!", flags: [64] });
        }

        if (interaction.customId === "verify_btn") {
            const roleId = "1453285948581216356";
            const sixtyDays = 60 * 24 * 60 * 60 * 1000;
            const accountAge = Date.now() - interaction.member.user.createdTimestamp;

            if (accountAge < sixtyDays) return interaction.reply({ content: "❌ Account must be 60 days old.", flags: [64] });

            try {
                const role = interaction.guild.roles.cache.get(roleId);
                await interaction.member.roles.add(role);
                return interaction.reply({ content: "✅ Verified!", flags: [64] });
            } catch (err) {
                return interaction.reply({ content: "❌ Role Error! Check Hierarchy.", flags: [64] });
            }
        }
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
        console.log("✅ Database Connected.");
        await client.login(process.env.TOKEN);
        setInterval(checkGiveaways, 10000); 
    } catch (error) {
        console.error("Login Error:", error);
    }
})();