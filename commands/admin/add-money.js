const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

// ID check backup ke liye rakha hai, but Slash Command permission se ye bando ko dikhega hi nahi
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add-money")
        .setDescription("Add coins to a user's balance")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user receiving the coins")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of coins to add")
                .setRequired(true)
        )
        // Isse normal users ko command menu mein ye command nahi dikhegi
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        // Extra security check
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({
                content: "❌ You do not have permission to use this admin command.",
                flags: [64], // Ephemeral (sirf use dikhega)
            });
        }

        const targetUser = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0) {
            return await interaction.reply({
                content: "❌ Amount must be a positive number.",
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

            profile.balance += amount;
            await profile.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: "Transaction Successful", iconURL: targetUser.displayAvatarURL() })
                .setColor("#2ecc71") // Success Green
                .setDescription(`Successfully added **🪙 ${amount.toLocaleString()}** to ${targetUser}'s balance.`)
                .addFields(
                    { name: "Updated Balance", value: `🪙 ${profile.balance.toLocaleString()}`, inline: true },
                    { name: "Action By", value: `${interaction.user.username}`, inline: true }
                )
                .setFooter({ text: "711 Bet • Admin Tools" })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Error updating database.", flags: [64] });
        }
    },
};