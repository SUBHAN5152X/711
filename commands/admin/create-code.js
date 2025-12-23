const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Code = require("../../schemas/Code");
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-code")
        .setDescription("Create a redeemable code (Admin only)")
        .addStringOption(opt => opt.setName("code").setDescription("Code string").setRequired(true))
        .addIntegerOption(opt => opt.setName("amount").setDescription("Coins reward").setRequired(true))
        .addIntegerOption(opt => opt.setName("maxuses").setDescription("How many people can use it").setRequired(false))
        .addStringOption(opt => opt.setName("expiry").setDescription("Expiry (YYYY-MM-DD)").setRequired(false)),

    run: async ({ interaction }) => {
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ content: "❌ No Permission.", ephemeral: true });
        }

        const codeStr = interaction.options.getString("code").toUpperCase();
        const amount = interaction.options.getInteger("amount");
        const maxUses = interaction.options.getInteger("maxuses") || 100; // Default 100 uses
        const expiryInput = interaction.options.getString("expiry");
        const expiry = expiryInput ? new Date(expiryInput) : null;

        try {
            const existing = await Code.findOne({ code: codeStr });
            if (existing) return await interaction.reply({ content: "❌ Code already exists!", ephemeral: true });

            await Code.create({
                code: codeStr,
                amount,
                createdBy: interaction.user.id,
                expiresAt: expiry,
                maxUses: maxUses // Make sure to add this field in your Code schema
            });

            // RoBets Style Embed
            const roBetsEmbed = new EmbedBuilder()
                .setAuthor({ name: '✅ Promo Code Created', iconURL: interaction.client.user.displayAvatarURL() })
                .setColor('#2ecc71') // RoBets Green
                .addFields(
                    { name: 'Code', value: `**${codeStr}**`, inline: false },
                    { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
                    { name: 'Max Uses', value: `${maxUses}`, inline: true },
                    { name: 'Expiry', value: `${expiry ? expiry.toDateString() : 'Never'}`, inline: true }
                )
                .setDescription(`\nUsers can redeem with: \`/redeem ${codeStr}\``)
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [roBetsEmbed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "Error creating code.", ephemeral: true });
        }
    },
};