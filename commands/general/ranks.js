const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ranks")
        .setDescription("View all available betting ranks"),

    run: async ({ interaction }) => {
        const ranksEmbed = new EmbedBuilder()
            .setTitle("BETRUSH RANKS")
            .setColor("#6b21a8")
            .setDescription(
                `**Bronze Gambler** - $1 Wagered\n` +
                `**Silver Gambler** - $5 Wagered\n` +
                `**Gold Grinder** - $20 Wagered\n` +
                `**Platinum Player** - $50 Wagered\n` +
                `**Emerald Highroller** - $100 Wagered\n` +
                `**Diamond God** - $200 Wagered`
            )
            .setFooter({ text: "711 Bet • Automatic Role Updates" });

        return await interaction.reply({ embeds: [ranksEmbed] });
    },
};