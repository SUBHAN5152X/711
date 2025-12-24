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
                    content: `❌ Aap kam se kam **200 points ($2.00)** withdraw kar sakte hain.` 
                });
            }

            // 2. Database Fetch with Error Handling
            let profile = await UserProfile.findOne({ userId });

            // Agar user database mein nahi hai ya balance kam hai
            if (!profile || profile.balance < amount) {
                const currentBal = profile ? profile.balance : 0;
                return await interaction.editReply({ 
                    content: `❌ Aapke paas itne points nahi hain! \n**Current Balance:** 🪙 ${currentBal}` 
                });
            }

            // 3. Stats Update
            profile.balance -= amount;
            profile.withdrawals = (profile.withdrawals || 0) + amount;
            profile.withdrawCount = (profile.withdrawCount || 0) + 1;
            await profile.save();

            // 4. Success Embed
            const withdrawEmbed = new EmbedBuilder()
                .setAuthor({ name: `Withdrawal Requested`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(
                    `✅ Successfully withdrawn **🪙 ${amount} points**.\n\n` +
                    `⚠️ **Next Step:**\n` +
                    `Please **make a ticket** in <#1453079406829375729> to receive your payment.`
                )
                .setColor('#2ecc71')
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            return await interaction.editReply({ embeds: [withdrawEmbed] });
            
        } catch (e) { 
            console.error("WITHDRAW_ERROR:", e);
            // Crash hone se bachaane ke liye catch block
            if (interaction.deferred) {
                return await interaction.editReply({ content: "❌ Database error! Please try again later." });
            }
        }
    },
};