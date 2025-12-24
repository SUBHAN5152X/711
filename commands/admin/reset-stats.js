const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

// Admin security backup
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset-stats")
        .setDescription("Completely reset a user's balance and stats (Admin Only)")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user whose stats will be wiped")
                .setRequired(true)
        )
        // Normal users ko menu mein nahi dikhegi
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        // Double security check
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({
                content: "❌ **Access Denied:** You don't have permission to wipe user data.",
                flags: [64], 
            });
        }

        const targetUser = interaction.options.getUser("user");

        try {
            // Database se user profile dhundo aur reset karo
            let profile = await UserProfile.findOne({ userId: targetUser.id });

            if (!profile) {
                return interaction.reply({ 
                    content: `❌ **Error:** No data found for ${targetUser.username} in the database.`, 
                    flags: [64] 
                });
            }

            // Stats ko zero par set karna
            profile.balance = 0;
            // Agar aapke schema mein wins/losses hain toh unhe bhi yahan zero kar sakte ho:
            // profile.wins = 0;
            // profile.losses = 0;

            await profile.save();

            const resetEmbed = new EmbedBuilder()
                .setAuthor({ name: "Data Wipe Successful", iconURL: targetUser.displayAvatarURL() })
                .setColor("#ff0000") // Danger Red
                .setDescription(`⚠️ All statistics and balance for ${targetUser} have been **permanently reset** to zero.`)
                .addFields(
                    { name: "Target User", value: `${targetUser.tag}`, inline: true },
                    { name: "Reset By", value: `${interaction.user.username}`, inline: true },
                    { name: "New Balance", value: "🪙 0", inline: true }
                )
                .setFooter({ text: "711 Bet • Data Purge System" })
                .setTimestamp();

            await interaction.reply({ embeds: [resetEmbed] });

        } catch (error) {
            console.error("RESET_STATS_ERROR:", error);
            await interaction.reply({ content: "❌ **System Error:** Could not reset the user's data.", flags: [64] });
        }
    },
};