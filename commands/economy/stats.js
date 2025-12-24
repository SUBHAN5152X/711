const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("View your betting stats"),

    run: async ({ interaction }) => {
        const profile = await UserProfile.findOne({ userId: interaction.user.id });
        if (!profile) return interaction.reply("Khelna shuru karo pehle!");

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Stats`)
            .addFields(
                { name: '💰 Balance', value: `🪙 ${profile.balance.toFixed(2)}`, inline: true },
                { name: '🔥 Total Wagered', value: `🪙 ${profile.wageredAmount || 0}`, inline: true },
                { name: '🏆 Total Wins', value: `${profile.wins || 0}`, inline: true },
                { name: '📈 Pure Profit', value: `🪙 ${profile.winAmount || 0}`, inline: true }
            )
            .setColor('#3498db');

        return interaction.reply({ embeds: [embed] });
    }
};