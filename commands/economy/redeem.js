const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");
const Code = require("../../schemas/Code");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem a code to get coins")
        .addStringOption(option =>
            option.setName("code")
                .setDescription("The code to redeem")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
        const userId = interaction.user.id;
        const codeInput = interaction.options.getString("code").toUpperCase();

        const code = await Code.findOne({ code: codeInput });
        if (!code) {
            await interaction.reply({ content: "Invalid code.", ephemeral: true });
            return;
        }

        // Check allowed roles
        if (code.allowedRoles.length > 0) {
            const memberRoles = interaction.member.roles.cache.map(r => r.id);
            const hasRole = memberRoles.some(role => code.allowedRoles.includes(role));
            if (!hasRole) {
                await interaction.reply({ content: "You do not have the required role to redeem this code.", ephemeral: true });
                return;
            }
        }

        if (code.expiresAt && code.expiresAt < new Date()) {
            await interaction.reply({ content: "This code has expired.", ephemeral: true });
            return;
        }

        if (code.redeemedBy.includes(userId)) {
            await interaction.reply({ content: "You have already redeemed this code.", ephemeral: true });
            return;
        }

        let profile = await UserProfile.findOne({ userId });
        if (!profile) profile = await UserProfile.create({ userId, balance: 0 });

        profile.balance += code.amount;
        await profile.save();

        code.redeemedBy.push(userId);
        await code.save();

        await interaction.reply(`✅ You redeemed **${code.amount} coins** with code **${codeInput}**. Your new balance: **${profile.balance}**`);
    },
};
