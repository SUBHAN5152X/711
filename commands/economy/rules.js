const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rules")
        .setDescription("View the official 711 Bet gambling rules"),

    run: async ({ interaction }) => {
        const serverLogo = interaction.guild.iconURL();
        const botLogo = interaction.client.user.displayAvatarURL();

        const rulesEmbed = new EmbedBuilder()
            .setAuthor({ name: `711 Bet | Official Rules & Guidelines`, iconURL: serverLogo })
            .setThumbnail(serverLogo)
            .setColor("#f1c40f") // Gold color for authority
            .setDescription(
                `To ensure a fair and fun experience for everyone, please follow these rules:\n\n` +
                `### ⚖️ General Rules\n` +
                `1. **No Begging:** Asking staff or other players for free coins is strictly prohibited.\n` +
                `2. **No Alts:** Using multiple accounts to farm rewards or bypass limits will result in a permanent ban.\n` +
                `3. **Respect Staff:** Our moderators are here to help. Harassment or disrespect will not be tolerated.\n\n` +
                `### 🎰 Gambling Policies\n` +
                `4. **Fair Play:** Any attempt to exploit bot bugs or glitches will lead to a balance reset and ban.\n` +
                `5. **No Refunds:** All bets are final. Points lost due to a bad bet or "House Edge" will not be refunded.\n` +
                `6. **Payout Proof:** For withdrawals, you **must** take a screenshot of your success message and open a ticket.\n\n` +
                `### 🛡️ Safety & Fraud\n` +
                `7. **Scamming:** Any user found scamming others through the \`/tip\` command will be blacklisted immediately.\n` +
                `8. **Terms:** By using 711 Bet, you agree that these points hold no real-world value unless redeemed through official channels.`
            )
            .setFooter({ text: "Play Responsibly • 711 Bet", iconURL: botLogo })
            .setTimestamp();

        return await interaction.reply({ embeds: [rulesEmbed] });
    },
};