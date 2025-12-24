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

            // 1. Basic Checks
            if (!promo) return interaction.reply({ content: "❌ Invalid code.", flags: [64] });
            if (promo.expiresAt && promo.expiresAt < new Date()) return interaction.reply({ content: "❌ This code has expired.", flags: [64] });
            if (promo.usedBy.length >= promo.maxUses) return interaction.reply({ content: "❌ This code has reached max uses.", flags: [64] });
            if (promo.usedBy.includes(userId)) return interaction.reply({ content: "❌ You have already redeemed this code.", flags: [64] });

            // 2. Role Check Logic
            if (promo.allowedRoleId) {
                if (!interaction.member.roles.cache.has(promo.allowedRoleId)) {
                    const role = interaction.guild.roles.cache.get(promo.allowedRoleId);
                    return interaction.reply({ 
                        content: `❌ This code is only for users with the **${role ? role.name : 'Required'}** role.`, 
                        flags: [64] 
                    });
                }
            }

            // 3. Process Redemption
            promo.usedBy.push(userId);
            await promo.save();

            let profile = await UserProfile.findOne({ userId });
            if (!profile) profile = new UserProfile({ userId });
            profile.balance += promo.amount;
            await profile.save();

            const redeemEmbed = new EmbedBuilder()
                .setTitle("🎉 Code Redeemed!")
                .setDescription(`Successfully added **🪙 ${promo.amount}** to your balance.`)
                .setColor("#2ecc71")
                .setFooter({ text: "711 Bet" });

            return await interaction.reply({ embeds: [redeemEmbed] });

        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "❌ Error processing redemption.", flags: [64] });
        }
    },
};