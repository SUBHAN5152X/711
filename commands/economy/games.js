const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("games")
        .setDescription("View all available casino games"),

    run: async ({ interaction }) => {
        const serverLogo = interaction.guild.iconURL();
        const botLogo = interaction.client.user.displayAvatarURL();

        const gamesEmbed = new EmbedBuilder()
            .setAuthor({ name: `711 Bet Games (5)`, iconURL: serverLogo })
            .setColor("#2b2d31")
            .setThumbnail(serverLogo)
            .setDescription(
                `**blackjack:** Play Blackjack where you try to beat the dealer by getting as close to 21 as possible.\n` +
                `**coinflip:** Flip a coin for a chance to multiply your points by 1.75x.\n` +
                `**gamble:** Risk your coins for a chance to win double or lose it all.\n` +
                `**mines:** Navigate a 5x5 grid to find diamonds and avoid hidden mines to increase your multiplier.\n` +
                `**tip:** Send your coins safely to another user in the server.`
            )
            .setFooter({ text: "Page 1/1 • 711 Bet Official", iconURL: botLogo })
            .setTimestamp();

        return await interaction.reply({ embeds: [gamesEmbed] });
    },
};