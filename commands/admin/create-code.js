const { SlashCommandBuilder } = require("discord.js");
const Code = require("../../schemas/Code");
const ADMIN_IDS = process.env.ADMIN_IDS.split(",");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-code")
        .setDescription("Create a redeemable code for coins (admin only)")
        .addStringOption(option =>
            option.setName("code")
                .setDescription("Code string")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Coins given when redeemed")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("expiry")
                .setDescription("Optional expiry date (YYYY-MM-DD)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("allowedroles")
                .setDescription("Comma-separated role IDs allowed to redeem (optional)")
                .setRequired(false)
        ),

    run: async ({ interaction }) => {
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            await interaction.reply({ content: "You do not have permission.", ephemeral: true });
            return;
        }

        const codeStr = interaction.options.getString("code").toUpperCase();
        const amount = interaction.options.getInteger("amount");
        const expiryInput = interaction.options.getString("expiry");
        const allowedRolesInput = interaction.options.getString("allowedroles");

        const expiry = expiryInput ? new Date(expiryInput) : null;
        const allowedRoles = allowedRolesInput
            ? allowedRolesInput.split(",").map(r => r.trim())
            : [];

        try {
            const existing = await Code.findOne({ code: codeStr });
            if (existing) {
                await interaction.reply({ content: "This code already exists.", ephemeral: true });
                return;
            }

            await Code.create({
                code: codeStr,
                amount,
                createdBy: interaction.user.id,
                expiresAt: expiry,
                allowedRoles,
            });

            await interaction.reply(`✅ Code **${codeStr}** created for ${amount} coins.${allowedRoles.length ? ` Only users with roles: ${allowedRoles.join(", ")} can redeem.` : ""}`);
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "Error creating code.", ephemeral: true });
        }
    },
};
