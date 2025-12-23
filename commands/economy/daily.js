const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const dailyAmount = 1;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Collect your daily reward!"),

    run: async ({ interaction }) => {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: "This command can only be used inside a server.",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply();

        try {
            let userProfile = await UserProfile.findOne({
                userId: interaction.user.id,
            });

            const today = new Date().toDateString();

            if (userProfile) {
                const lastDaily = userProfile.lastDailyCollected?.toDateString();

                if (lastDaily === today) {
                    await interaction.editReply(
                        "You have already collected your daily reward. Come back tomorrow."
                    );
                    return;
                }
            } else {
                userProfile = new UserProfile({
                    userId: interaction.user.id,
                    balance: 0,
                });
            }

            userProfile.balance += dailyAmount;
            userProfile.lastDailyCollected = new Date();
            await userProfile.save();

            await interaction.editReply(
                `${dailyAmount} coin added.\nNew balance: ${userProfile.balance}`
            );
        } catch (error) {
            console.error(`Error handling /daily:`, error);
            await interaction.editReply("An error occurred while collecting your daily reward.");
        }
    },
};
