const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile"); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw your points (Min $2.00)')
        .addIntegerOption(o => o.setName('amount').setDescription('Points to withdraw (Min 200)').setRequired(true)),

    run: async ({ interaction }) => {
        // Safe defer reply to prevent timeout crashes
        await interaction.deferReply({ ephemeral: true }); 

        const amount = interaction.options.getInteger('amount');
        const userId = interaction.user.id;

        try {
            // 1. Minimum Amount Check
            if (amount < 200) {
                return await interaction.editReply({ 
                    content: `❌ You must withdraw at least **200 points ($2.00)**.` 
                });
            }

            // 2. Database Fetch
            let profile = await UserProfile.findOne({ userId });

            // 3. Balance Check
            if (!profile || profile.balance < amount) {
                const currentBal = profile ? profile.balance : 0;
                return await interaction.editReply({ 
                    content: `❌ You do not have enough points!\n**Current Balance:** 🪙 ${currentBal}` 
                });
            }

            // 4. Stats Update
            profile.balance -= amount;
            profile.withdrawals = (profile.withdrawals || 0) + amount;
            profile.withdrawCount = (profile.withdrawCount || 0) + 1;
            await profile.save();

            // 5. Success Embed with Screenshot Instruction
            const withdrawEmbed = new EmbedBuilder()
                .setAuthor({ name: `Withdrawal Requested`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    `✅ Successfully withdrawn **🪙 ${amount} points**.\n\n` +
                    `⚠️ **Next Steps:**\n` +
                    `1. **You must take a screenshot of this message.**\n` +
                    `2. **Open a ticket** in <#1453079406829375729> and send the screenshot to receive your payout.`
                )
                .setColor('#2ecc71')
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            return await interaction.editReply({ embeds: [withdrawEmbed] });
            
        } catch (e) { 
            console.error("WITHDRAW_ERROR:", e);
            if (interaction.deferred) {
                return await interaction.editReply({ content: "❌ A database error occurred! Please try again later." });
            }
        }
    },
};