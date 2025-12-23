const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_RATE = 0.4; // 40% win chance
const WIN_CHANNEL_ID = "1453089703438975127"; // Announcement channel ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Gamble your coins for a chance to win more")
        .addIntegerOption(option =>
            option.setName("amount").setDescription("Amount of coins to gamble").setRequired(true)
        ),

    run: async ({ interaction }) => {
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;

        if (amount <= 0) {
            return interaction.reply({ content: "❌ You must gamble at least 1 coin.", ephemeral: true });
        }

        try {
            let userProfile = await UserProfile.findOne({ userId });

            if (!userProfile || userProfile.balance < amount) {
                return interaction.reply({ content: "❌ Not enough balance!", ephemeral: true });
            }

            const win = Math.random() < WIN_RATE;
            const resultEmbed = new EmbedBuilder()
                .setAuthor({ name: `Gamble Result`, iconURL: interaction.user.displayAvatarURL() })
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (win) {
                // --- Stats Update: Win logic ---
                userProfile.balance += amount;
                userProfile.wins = (userProfile.wins || 0) + 1; 
                userProfile.winAmount = (userProfile.winAmount || 0) + amount; 
                await userProfile.save();

                resultEmbed
                    .setColor('#2ecc71') // Green for Win
                    .setDescription(
                        `🎉 **You Won!**\n\n` +
                        `💰 **Gained:** 🪙 ${amount.toFixed(2)}\n` +
                        `🏦 **New Balance:** 🪙 ${userProfile.balance.toFixed(2)}`
                    );

                // --- Announcement Logic ---
                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) {
                    winChannel.send(`🎉 **${interaction.user.username}** has just won **🪙 ${amount}** in **Gamble** !!`);
                }

            } else {
                // Loss logic
                userProfile.balance -= amount;
                await userProfile.save();

                resultEmbed
                    .setColor('#ff4b2b') // Red for Loss
                    .setDescription(
                        `💀 **You Lost!**\n\n` +
                        `📉 **Lost:** 🪙 ${amount.toFixed(2)}\n` +
                        `🏦 **New Balance:** 🪙 ${userProfile.balance.toFixed(2)}`
                    );
            }

            return await interaction.reply({ embeds: [resultEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "An error occurred.", ephemeral: true });
        }
    },
};