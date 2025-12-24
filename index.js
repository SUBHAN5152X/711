require("dotenv/config");
const { Client, IntentsBitField, Collection, EmbedBuilder } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Giveaway = require("./schemas/Giveaway"); // Giveaway Schema import karein

const PREFIX = process.env.PREFIX || "-";

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
    GIVEAWAY AUTO-END CHECKER
================================ */
// Ye har 10 second mein check karega ki koi giveaway khatam toh nahi hua
async function checkGiveaways() {
    const now = new Date();
    const endedGiveaways = await Giveaway.find({ ended: false, endTime: { $lte: now } });

    for (const data of endedGiveaways) {
        try {
            const channel = await client.channels.fetch(data.channelId);
            const msg = await channel.messages.fetch(data.messageId);
            
            // Winners pick karne ka logic (Helper function)
            await endGiveawayLogic(client, data, msg);
        } catch (err) {
            console.error("Giveaway end error:", err);
            data.ended = true; // Error pe bhi true kar rahe taaki loop na fase
            await data.save();
        }
    }
}

/* ================================
    INTERACTION HANDLER
================================ */
client.on("interactionCreate", async (interaction) => {
    
    // 1. Autocomplete
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete({ interaction, client });
        return;
    }

    // 2. Buttons
    if (interaction.isButton()) {
        // --- GIVEAWAY JOIN BUTTON ---
        if (interaction.customId === "ga_join") {
            const data = await Giveaway.findOne({ messageId: interaction.message.id });
            if (!data || data.ended) return interaction.reply({ content: "❌ Ye giveaway khatam ho chuka hai!", flags: [64] });

            if (data.participants.includes(interaction.user.id)) {
                return interaction.reply({ content: "❌ Aap pehle hi join kar chuke ho!", flags: [64] });
            }

            data.participants.push(interaction.user.id);
            await data.save();
            return interaction.reply({ content: "✅ Giveaway joined! Good luck!", flags: [64] });
        }

        // --- VERIFICATION SYSTEM ---
        if (interaction.customId === "verify_btn") {
            const roleId = "1453285948581216356";
            const sixtyDays = 60 * 24 * 60 * 60 * 1000;
            const accountAge = Date.now() - interaction.member.user.createdTimestamp;

            if (accountAge < sixtyDays) {
                return interaction.reply({ content: "❌ Account 60 din purana hona chahiye.", flags: [64] });
            }

            try {
                const role = interaction.guild.roles.cache.get(roleId);
                await interaction.member.roles.add(role);
                return interaction.reply({ content: "✅ Verified!", flags: [64] });
            } catch (err) {
                return interaction.reply({ content: "❌ Role Error!", flags: [64] });
            }
        }
    }
});

// Helper function to pick winners and edit embed
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
    DATABASE + LOGIN
================================ */
(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Database Connected.");
        
        await client.login(process.env.TOKEN);
        console.log(`✅ Logged in as ${client.user.tag}`);

        // Bot online aate hi checker shuru karein
        setInterval(checkGiveaways, 10000); 

    } catch (error) {
        console.error("Login Error:", error);
    }
})();

// Command Handler and Prefix logic (Same as yours)
// ...