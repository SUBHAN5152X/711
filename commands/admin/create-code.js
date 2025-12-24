const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Code = require("../../schemas/Code");
const ms = require("ms"); // Time parsing ke liye

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-code")
        .setDescription("Create a redeemable promo code")
        .addStringOption(opt => opt.setName("code").setDescription("The code string (e.g. WINNER)").setRequired(true))
        .addIntegerOption(opt => opt.setName("amount").setDescription("Coins reward amount").setRequired(true))
        .addIntegerOption(opt => opt.setName("maxuses").setDescription("Total uses allowed").setRequired(false))
        .addStringOption(opt => opt.setName("duration").setDescription("Duration (e.g. 10m, 1h, 1d)").setRequired(false))
        .addRoleOption(opt => opt.setName("allowed_role").setDescription("Only users with this role can redeem").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
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
                return interaction.reply({ content: "❌ Invalid duration format! Use: `10m`, `1h`, or `1d`.", flags: [64] });
            }
            expiry = new Date(Date.now() + milliseconds);
        }

        try {
            const existing = await Code.findOne({ code: codeStr });
            if (existing) return interaction.reply({ content: "❌ This code already exists!", flags: [64] });

            // Database mein data save karo
            await Code.create({
                code: codeStr,
                amount,
                createdBy: interaction.user.id,
                expiresAt: expiry,
                maxUses: maxUses,
                allowedRoleId: allowedRole ? allowedRole.id : null // Schema mein ye field check kar lena
            });

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Promo Code Created', iconURL: interaction.guild.iconURL() })
                .setColor('#2ecc71')
                .addFields(
                    { name: 'Code', value: `\`${codeStr}\``, inline: true },
                    { name: 'Reward', value: `🪙 ${amount}`, inline: true },
                    { name: 'Max Uses', value: `${maxUses}`, inline: true },
                    { name: 'Duration', value: `${durationInput || 'Permanent'}`, inline: true },
                    { name: 'Allowed Role', value: `${allowedRole ? allowedRole : 'Everyone'}`, inline: true }
                )
                .setDescription(`\n**Redeem Command:** \`/redeem code:${codeStr}\``)
                .setFooter({ text: '711 Bet • Secure Systems' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "❌ Error while creating the code in database.", flags: [64] });
        }
    },
};