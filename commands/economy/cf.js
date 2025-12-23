const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const MULTIPLIER = 1.75; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cf")
        .setDescription("Flip a coin and gamble your coins")
        .addStringOption(option =>
            option.setName("side").setDescription("Choose heads or tails").setRequired(true)
                .addChoices({ name: "Heads", value: "heads" }, { name: "Tails", value: "tails" })
        )
        .addIntegerOption(option =>
            option.setName("amount").setDescription("Amount of coins to gamble").setRequired(true)
        ),

    run: async ({ interaction }) => {
        const side = interaction.options.getString("side");
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;

        if (amount <= 0) return interaction.reply({ content: "❌ Amount must be greater than 0.", ephemeral: true });

        try {
            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile || userProfile.balance < amount) {
                return interaction.reply({ content: "❌ Not enough balance.", ephemeral: true });
            }

            // Coin flip logic
            const coinResult = Math.random() < 0.5 ? "heads" : "tails";
            const isWin = side === coinResult;

            let resultEmbed = new EmbedBuilder()
                .setAuthor({ name: `Coinflip Result`, iconURL: interaction.user.displayAvatarURL() })
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (isWin) {
                const winAmount = Math.floor(amount * MULTIPLIER);
                
                // --- Stats Update: Win logic ---
                userProfile.balance += (winAmount - amount); // Balance update
                userProfile.wins = (userProfile.wins || 0) + 1; // Game count increment
                userProfile.winAmount = (userProfile.winAmount || 0) + winAmount; // Total won amount
                await userProfile.save();

                resultEmbed
                    .setColor('#2ecc71') // Win Green
                    .setDescription(
                        `🪙 The coin landed on: **${coinResult.toUpperCase()}**\n\n` +
                        `🎉 **You Won!**\n` +
                        `💰 **Profit:** 🪙 ${winAmount.toFixed(2)}\n` +
                        `🏦 **New Balance:** 🪙 ${userProfile.balance.toFixed(2)}`
                    );
            } else {
                // Loss logic
                userProfile.balance -= amount;
                await userProfile.save();

                resultEmbed
                    .setColor('#ff4b2b') // Loss Red
                    .setDescription(
                        `🪙 The coin landed on: **${coinResult.toUpperCase()}**\n\n` +
                        `💀 **You Lost!**\n` +
                        `📉 **Loss:** 🪙 ${amount.toFixed(2)}\n` +
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