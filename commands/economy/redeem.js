const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");
const Code = require("../../schemas/Code"); // Make sure this path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem a gift code")
        .addStringOption(option => 
            option.setName("code")
                .setDescription("Enter your code")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
        const codeInput = interaction.options.getString("code");
        const userId = interaction.user.id;

        try {
            // 1. Find the code in Database
            const promo = await Code.findOne({ code: codeInput });

            if (!promo) {
                return interaction.reply({ content: "❌ Invalid or expired code!", ephemeral: true });
            }

            // 2. CHECK: If user has already redeemed this code
            // Assuming your Code schema has a 'redeemedBy' array
            if (promo.redeemedBy && promo.redeemedBy.includes(userId)) {
                return interaction.reply({ content: "❌ You have already redeemed this code!", ephemeral: true });
            }

            // 3. Update User Balance
            let profile = await UserProfile.findOne({ userId });
            if (!profile) {
                profile = new UserProfile({ userId, balance: 0 });
            }

            profile.balance += promo.amount;
            
            // 4. Update Code Data: Add user to redeemed list
            // Using $push to prevent infinite redeems
            await Code.findOneAndUpdate(
                { code: codeInput },
                { $push: { redeemedBy: userId } }
            );

            await profile.save();

            const embed = new EmbedBuilder()
                .setTitle("🎉 Code Redeemed!")
                .setDescription(`Successfully added **🪙 ${promo.amount.toLocaleString()}** to your balance.`)
                .setColor("#2ecc71")
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Redeem Error:", error);
            return interaction.reply({ content: "⚠️ Something went wrong while redeeming!", ephemeral: true });
        }
    }
};