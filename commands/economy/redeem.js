const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Code = require("../../schemas/Code");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem a promo code for coins")
        .addStringOption(opt => opt.setName("code").setDescription("Enter the code").setRequired(true)),

    run: async ({ interaction }) => {
        const codeStr = interaction.options.getString("code").toUpperCase();
        const userId = interaction.user.id;

        try {
            const promo = await Code.findOne({ code: codeStr });

            if (!promo) {
                return interaction.reply({ content: "❌ This code does not exist.", ephemeral: true });
            }

            // 1. Array Initialization Check (Yeh zaroori hai crash rokne ke liye)
            if (!promo.usedBy) {
                promo.usedBy = [];
            }

            // 2. Expiry Check
            if (promo.expiresAt && promo.expiresAt < new Date()) {
                return interaction.reply({ content: "❌ This code has expired.", ephemeral: true });
            }

            // 3. Max Uses Check
            if (promo.usedBy.length >= promo.maxUses) {
                return interaction.reply({ content: "❌ This code has reached its maximum usage limit.", ephemeral: true });
            }

            // 4. Already Redeemed Check
            if (promo.usedBy.includes(userId)) {
                return interaction.reply({ content: "❌ You have already redeemed this code.", ephemeral: true });
            }

            // 5. Role Restriction Check
            if (promo.allowedRoleId) {
                if (!interaction.member.roles.cache.has(promo.allowedRoleId)) {
                    return interaction.reply({ 
                        content: `❌ You don't have the required role to use this code.`, 
                        ephemeral: true 
                    });
                }
            }

            // --- REDEMPTION START ---
            
            // Add user to used list safely
            promo.usedBy.push(userId);
            await promo.save();

            // Update user balance
            const updatedProfile = await UserProfile.findOneAndUpdate(
                { userId: userId },
                { $inc: { balance: promo.amount } },
                { upsert: true, new: true }
            );

            const redeemEmbed = new EmbedBuilder()
                .setTitle("🎉 Successful Redemption")
                .setDescription(`Successfully added **🪙 ${promo.amount.toLocaleString()}** to your balance!`)
                .addFields({ name: "New Balance", value: `🪙 ${updatedProfile.balance.toLocaleString()}` })
                .setColor("#2ecc71")
                .setTimestamp()
                .setFooter({ text: "711 Bet • Casino System" });

            return await interaction.reply({ embeds: [redeemEmbed] });

        } catch (err) {
            console.error("Redeem Command Error:", err);
            // Check if interaction already replied
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({ content: "❌ An internal error occurred.", ephemeral: true });
            }
            return interaction.reply({ content: "❌ An internal error occurred.", ephemeral: true });
        }
    },
};