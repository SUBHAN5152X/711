const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset-stats")
        .setDescription("Reset all stats of a specific user (Admin Only)")
        .addUserOption(opt => opt.setName("target").setDescription("The user whose stats you want to reset").setRequired(true))
        // Sirf Administrator permission waale hi ise use kar payenge
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        const targetUser = interaction.options.getUser("target");

        try {
            // Database se user profile find karo
            let profile = await UserProfile.findOne({ userId: targetUser.id });

            if (!profile) {
                return interaction.reply({ 
                    content: `❌ **${targetUser.username}** has no data in the database.`, 
                    flags: [64] 
                });
            }

            // Saare stats ko reset (zero) karna
            profile.balance = 0;
            profile.wins = 0;
            profile.losses = 0;
            profile.winAmount = 0;
            profile.wageredAmount = 0;
            profile.withdrawals = 0;
            profile.withdrawCount = 0;
            
            // Agar aapne alag se games ke stats rakhe hain toh unhe bhi reset karein
            profile.blackjackWins = 0;
            profile.minesWins = 0;
            profile.cfWins = 0;

            await profile.save();

            const resetEmbed = new EmbedBuilder()
                .setTitle("🧹 Stats Reset Successful")
                .setDescription(`All statistics and balance for **${targetUser.username}** have been wiped.`)
                .addFields(
                    { name: "User", value: `${targetUser}`, inline: true },
                    { name: "Status", value: "Everything set to 0", inline: true }
                )
                .setColor("#ff3e3e")
                .setTimestamp()
                .setFooter({ text: "711 Bet Admin System" });

            return await interaction.reply({ embeds: [resetEmbed] });

        } catch (error) {
            console.error("RESET_STATS_ERROR:", error);
            return interaction.reply({ 
                content: "❌ An error occurred while resetting stats.", 
                flags: [64] 
            });
        }
    },
};