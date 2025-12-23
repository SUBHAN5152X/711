const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Code = require("../../schemas/Code");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem a promo code for rewards")
        .addStringOption(opt => opt.setName("code").setDescription("Enter the code").setRequired(true)),

    run: async ({ interaction }) => {
        const codeInput = interaction.options.getString("code").toUpperCase();
        const userId = interaction.user.id;
        await interaction.deferReply();

        try {
            const codeData = await Code.findOne({ code: codeInput });

            // 1. Error: Code Not Found
            if (!codeData) {
                const errEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'crushmmerror: Invalid Code', iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`❌ The code \`${codeInput}\` does not exist or has expired.`)
                    .setColor('#ff4b2b') // Red Color
                    .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() });
                return await interaction.editReply({ embeds: [errEmbed] });
            }

            // 2. Error: Already Redeemed
            if (codeData.redeemedBy.includes(userId)) {
                const usedEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'crushmmerror: Already Redeemed', iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`⌛ You have already claimed the rewards for code \`${codeInput}\`.`)
                    .setColor('#f1c40f') // Yellow/Gold
                    .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() });
                return await interaction.editReply({ embeds: [usedEmbed] });
            }

            // 3. Error: Expiry Check
            if (codeData.expiresAt && new Date() > codeData.expiresAt) {
                const expiredEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'crushmmerror: Code Expired', iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`🥀 This promo code has expired.`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() });
                return await interaction.editReply({ embeds: [expiredEmbed] });
            }

            // 4. Success: Redeem Logic
            await UserProfile.findOneAndUpdate(
                { userId },
                { $inc: { balance: codeData.amount, bonusReceived: codeData.amount } }, // Stats update
                { upsert: true }
            );

            codeData.redeemedBy.push(userId);
            await codeData.save();

            // Premium Success Embed
            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: 'crushmminfo: Code Redeemed!', iconURL: interaction.user.displayAvatarURL() })
                .setTitle(`✅ Successfully claimed \`${codeInput}\``)
                .setDescription(`You have received **🪙 ${codeData.amount.toFixed(2)}** in your balance.`)
                .addFields(
                    { name: 'Reward', value: `🪙 ${codeData.amount.toFixed(2)} points`, inline: true },
                    { name: 'Type', value: `Promo Code`, inline: true }
                )
                .setColor('#2ecc71') // RoBets Green
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })