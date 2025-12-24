const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Code = require("../../schemas/Code");
const ms = require("ms");

// Admin IDs from .env for extra security layer
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-code")
        .setDescription("Create a redeemable promo code (Admin Only)")
        .addStringOption(opt => opt.setName("code").setDescription("The code string (e.g. WINNER)").setRequired(true))
        .addIntegerOption(opt => opt.setName("amount").setDescription("Coins reward amount").setRequired(true))
        .addIntegerOption(opt => opt.setName("maxuses").setDescription("Total uses allowed").setRequired(false))
        .addStringOption(opt => opt.setName("duration").setDescription("Duration (e.g. 10m, 1h, 1d)").setRequired(false))
        .addRoleOption(opt => opt.setName("allowed_role").setDescription("Only users with this role can redeem").setRequired(false))
        // Isse command menu mein sirf Admins ko dikhegi
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        // Double Check: Only specified Admin IDs can run this
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ 
                content: "❌ Critical Error: You are not authorized to create codes.", 
                flags: [64] 
            });
        }

        const codeStr = interaction.options.getString("code").toUpperCase();
        const amount = interaction.options.getInteger("amount");
        const maxUses = interaction.options.getInteger("maxuses") || 100;
        const durationInput = interaction.options.getString("duration");
        const allowedRole = interaction.options.getRole("allowed_role");

        // Time parsing logic
        let expiry = null;
        if (durationInput) {
            const milliseconds = ms(durationInput);
            if (!milliseconds) {
                return interaction.reply({ 
                    content: "❌ **Invalid Format:** Please use `10m`, `1h`, or `1d` for duration.", 
                    flags: [64] 
                });
            }
            expiry = new Date(Date.now() + milliseconds);
        }

        try {
            const existing = await Code.findOne({ code: codeStr });
            if (existing) return interaction.reply({ content: "❌ **Database Error:** This code already exists!", flags: [64] });

            // Create entry in MongoDB
            await Code.create({
                code: codeStr,
                amount,
                createdBy: interaction.user.id,
                expiresAt: expiry,
                maxUses: maxUses,
                allowedRoleId: allowedRole ? allowedRole.id : null
            });

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: 'System Promo Created', iconURL: interaction.guild.iconURL() })
                .setColor('#27ae60')
                .setDescription(`New promo code has been successfully registered in the database.`)
                .addFields(
                    { name: '🎫 Code', value: `\`${codeStr}\``, inline: true },
                    { name: '🪙 Reward', value: `${amount.toLocaleString()}`, inline: true },
                    { name: '👥 Limit', value: `${maxUses} Uses`, inline: true },
                    { name: '⏳ Expiry', value: `${durationInput || 'Permanent'}`, inline: true },
                    { name: '🔐 Role Lock', value: `${allowedRole ? allowedRole.name : 'None'}`, inline: true }
                )
                .setFooter({ text: '711 Bet • Administrative Panel', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "❌ **System Error:** Could not save the code to the database.", flags: [64] });
        }
    },
};