const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tip")
        .setDescription("Tip points to another user")
        .addUserOption(opt => opt.setName("user").setDescription("The user to tip").setRequired(true))
        .addIntegerOption(opt => opt.setName("amount").setDescription("Amount to tip").setRequired(true)),

    run: async ({ interaction }) => {
        const targetUser = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");
        const senderId = interaction.user.id;

        if (targetUser.id === senderId) return interaction.reply({ content: "❌ Khud ko tip nahi de sakte!", flags: [MessageFlags.Ephemeral] });
        if (amount <= 0) return interaction.reply({ content: "❌ Amount 0 se zyada hona chahiye.", flags: [MessageFlags.Ephemeral] });

        try {
            // 1. Sender Profile Check (Crash protection)
            let senderProfile = await UserProfile.findOne({ userId: senderId });
            if (!senderProfile || senderProfile.balance < amount) {
                return interaction.reply({ content: "❌ Aapke paas itne points nahi hain!", flags: [MessageFlags.Ephemeral] });
            }

            // 2. Target Profile Check (Agar receiver database mein nahi hai toh create karo)
            let targetProfile = await UserProfile.findOne({ userId: targetUser.id });
            if (!targetProfile) {
                targetProfile = new UserProfile({ userId: targetUser.id, balance: 0 });
            }

            // 3. Transaction
            senderProfile.balance -= amount;
            targetProfile.balance += amount;

            await senderProfile.save();
            await targetProfile.save();

            const tipEmbed = new EmbedBuilder()
                .setColor("#2ecc71")
                .setDescription(`✅ **${interaction.user.username}** tipped **🪙 ${amount}** to **${targetUser.username}**!`);

            return await interaction.reply({ embeds: [tipEmbed] });

        } catch (error) {
            console.error("TIP_ERROR:", error);
            return interaction.reply({ content: "❌ Transaction fail ho gayi. Baad mein try karein.", flags: [MessageFlags.Ephemeral] });
        }
    },
};