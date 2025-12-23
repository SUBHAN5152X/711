const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const ADMIN_IDS = process.env.ADMIN_IDS.split(",");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove-money")
        .setDescription("Remove coins from a user (admin only)")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User to remove money from")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of coins to remove")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            await interaction.reply({
                content: "You do not have permission to use this command.",
                ephemeral: true,
            });
            return;
        }

        const targetUser = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0) {
            await interaction.reply({
                content: "Amount must be greater than 0.",
                ephemeral: true,
            });
            return;
        }

        let profile = await UserProfile.findOne({ userId: targetUser.id });

        if (!profile) {
            profile = new UserProfile({
                userId: targetUser.id,
                balance: 0,
            });
        }

        profile.balance -= amount;
        if (profile.balance < 0) profile.balance = 0;

        await profile.save();

        await interaction.reply(
            `✅ Removed ${amount} coins from ${targetUser.username}. New balance: ${profile.balance}`
        );
    },
};
