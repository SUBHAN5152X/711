const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const RANKS = [
    { name: "Bronze Gambler", id: "1453276714514776174", req: 100 },
    { name: "Silver Gambler", id: "1453277151657726115", req: 500 },
    { name: "Gold Grinder", id: "1453277975314174085", req: 2000 },
    { name: "Platinum Player", id: "1453278389870788618", req: 5000 },
    { name: "Emerald Highroller", id: "1453278627637755945", req: 10000 },
    { name: "Diamond God", id: "1453278874820673547", req: 20000 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("View your current rank and wager progress"),

    run: async ({ interaction }) => {
        const userId = interaction.user.id;
        const profile = await UserProfile.findOne({ userId });
        const wagered = profile ? (profile.wageredAmount || 0) : 0;

        // Find Current and Next Rank
        let currentRank = RANKS.filter(r => wagered >= r.req).pop() || { name: "No Rank", req: 0 };
        let nextRank = RANKS.find(r => wagered < r.req);

        // Progress Bar Logic
        const progressBarLength = 12;
        let progressPercent = 0;
        let progressDisplay = "";

        if (nextRank) {
            progressPercent = (wagered / nextRank.req) * 100;
            const filledBlocks = Math.round((wagered / nextRank.req) * progressBarLength);
            progressDisplay = "▰".repeat(filledBlocks) + "▱".repeat(progressBarLength - filledBlocks);
        } else {
            progressPercent = 100;
            progressDisplay = "▰".repeat(progressBarLength);
        }

        // Auto-Role Check
        if (currentRank.id) {
            const role = interaction.guild.roles.cache.get(currentRank.id);
            if (role && !interaction.member.roles.cache.has(role.id)) {
                await interaction.member.roles.add(role).catch(() => {});
            }
        }

        const rankEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Profile`, iconURL: interaction.user.displayAvatarURL() })
            .setColor("#f39c12")
            .setDescription(
                `**Rank:** ${currentRank.name}\n` +
                `**Wagered:** 🪙 ${wagered.toLocaleString()}\n\n` +
                `${progressDisplay} ${progressPercent.toFixed(1)}%\n` +
                (nextRank ? `Next Rank: **${nextRank.name}** (${(nextRank.req - wagered).toLocaleString()} more)` : `You have reached the **Maximum Rank**!`)
            )
            .setFooter({ text: "711 Bet • Keep wagering to level up!" });

        return await interaction.reply({ embeds: [rankEmbed] });
    },
};