const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

// Multiplier 1.75x set kar diya hai
const MULTIPLIER = 1.75; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cf")
        .setDescription("Flip a coin and gamble your coins")
        .addStringOption(option =>
            option
                .setName("side")
                .setDescription("Choose heads or tails")
                .setRequired(true)
                .addChoices(
                    { name: "Heads", value: "heads" },
                    { name: "Tails", value: "tails" }
                )
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of coins to gamble")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
        const side = interaction.options.getString("side");
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;

        if (amount <= 0) {
            return interaction.reply({ content: "Amount must be greater than 0.", ephemeral: true });
        }

        const userProfile = await UserProfile.findOne({ userId });
        if (!userProfile || userProfile.balance < amount) {
            return interaction.reply({ content: "Not enough balance.", ephemeral: true });
        }

        // 1. Bet amount deduct karna
        userProfile.balance -= amount;

        // 2. Coin flip logic
        const coinResult = Math.random() < 0.5 ? "heads" : "tails";
        const isWin = side === coinResult;

        if (isWin) {
            // Profit calculation (1.75x)
            const winAmount = Math.floor(amount * MULTIPLIER);
            userProfile.balance += winAmount;

            await userProfile.save();

            return interaction.reply(
                `🪙 Coin: **${coinResult}**\n` +
                `🎉 You won **${winAmount} coins** (1.75x)\n` + 
                `💰 Balance: **${userProfile.balance}**`
            );
        } else {
            await userProfile.save();

            return interaction.reply(
                `🪙 Coin: **${coinResult}**\n` +
                `💀 You lost **${amount} coins**\n` +
                `💰 Balance: **${userProfile.balance}**`
            );
        }
    },
};
