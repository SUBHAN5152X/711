const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

// Admin security backup
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove-money")
        .setDescription("Deduct coins from a user's balance (Admin Only)")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user to remove coins from")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of coins to remove")
                .setRequired(true)
        )
        // Hidden from command menu for regular users
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        // Double security check
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({
                content: "❌ **Access Denied:** You are not authorized to use this administrative tool.",
                flags: [64], 
            });
        }

        const targetUser = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0) {
            return await interaction.reply({
                content: "❌ **Invalid Amount:** Please enter a number greater than 0.",
                flags: [64],
            });
        }

        try {
            let profile = await UserProfile.findOne({ userId: targetUser.id });

            if (!profile) {
                profile = new UserProfile({
                    userId: targetUser.id,
                    balance: 0,
                });
            }

            // Calculate new balance (Balance negative nahi hone dega)
            const oldBalance = profile.balance;
            profile.balance -= amount;
            if (profile.balance < 0) profile.balance = 0;

            await profile.save();

            const deductEmbed = new EmbedBuilder()
                .setAuthor({ name: "Balance Deduction", iconURL: targetUser.displayAvatarURL() })
                .setColor("#e67e22") // Warning Orange
                .setDescription(`Successfully removed **🪙 ${amount.toLocaleString()}** from ${targetUser}'s account.`)
                .addFields(
                    { name: "Previous Balance", value: `🪙 ${oldBalance.toLocaleString()}`, inline: true },
                    { name: "New Balance", value: `🪙 ${profile.balance.toLocaleString()}`, inline: true },
                    { name: "Staff Member", value: `${interaction.user.username}`, inline: true }
                )
                .setFooter({ text: "711 Bet • Financial Logs" })
                .setTimestamp();

            await interaction.reply({ embeds: [deductEmbed] });

        } catch (error) {
            console.error("REMOVE_MONEY_ERROR:", error);
            await interaction.reply({ content: "❌ **Error:** Failed to update the user's balance in the database.", flags: [64] });
        }
    },
};