const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_RATE = 0.4; // 40% win chance

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Gamble your coins for a chance to win more")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of coins to gamble")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
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

        const win = Math.random() < WIN_RATE;

        if (win) {
            userProfile.balance += amount;
            await userProfile.save();

            await interaction.reply(
                `🎉 You **won**!\nYou gained **${amount} coins**.\nNew balance: **${userProfile.balance}**`
            );
        } else {
            userProfile.balance -= amount;
            await userProfile.save();

            await interaction.reply(
                `💀 You **lost**!\nYou lost **${amount} coins**.\nNew balance: **${userProfile.balance}**`
            );
        }
    },
};
