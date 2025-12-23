const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_RATE = 0.4;

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
            await interaction.reply({
                content: "You must gamble at least 1 coin.",
                ephemeral: true,
            });
            return;
        }

        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile || userProfile.balance < amount) {
            await interaction.reply({
                content: "You do not have enough coins to gamble that amount.",
                ephemeral: true,
            });
            return;
        }

        // Coin flip result
        const coinResult = Math.random() < 0.5 ? "heads" : "tails";

        // House win/loss logic
        const win = Math.random() < WIN_RATE && side === coinResult;

        if (win) {
            userProfile.balance += amount;
            await userProfile.save();

            await interaction.reply(
                `🪙 The coin landed on **${coinResult}**!\n` +
                `🎉 You **won ${amount} coins**.\n` +
                `New balance: **${userProfile.balance}**`
            );
        } else {
            userProfile.balance -= amount;
            await userProfile.save();

            await interaction.reply(
                `🪙 The coin landed on **${coinResult}**!\n` +
                `💀 You **lost ${amount} coins**.\n` +
                `New balance: **${userProfile.balance}**`
            );
        }
    },
};
