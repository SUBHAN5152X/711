const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bal')
        .setDescription('Check your points balance'),

    run: async ({ interaction, message }) => {
        // 1. Pehle reply ko "Defer" karein taaki "Did not respond" error na aaye
        if (interaction) await interaction.deferReply();

        try {
            const user = interaction ? interaction.user : message.author;
            const userId = user.id;

            // 2. Database se data nikalna
            let userProfile = await UserProfile.findOne({ userId });

            if (!userProfile) {
                const noProfile = "❌ Aapka profile nahi mila. Pehle kuch game khelein!";
                return interaction ? interaction.editReply(noProfile) : message.reply(noProfile);
            }

            // 3. Premium Embed Design
            const balanceEmbed = new EmbedBuilder()
                .setAuthor({ 
                    name: `crushmminfo: ${user.username}'s Balance`, 
                    iconURL: user.displayAvatarURL() 
                })
                .setDescription(
                    `**Points:** \`${userProfile.balance.toFixed(2)}\`\n` +
                    `**LTC:** \`0.0000\`\n` +
                    `**USD:** \`$N/A\``
                )
                .addFields(
                    { name: '━━━━━━━━━━━━━━━━━━━━━━━━', value: ' ' },
                    { name: '💰 POINTS BALANCE', value: `## 🪙 ${userProfile.balance.toFixed(2)}`, inline: false }
                )
                .setColor('#3b82f6') 
                .setFooter({ text: '711 Bet • Dec 23, 2025' })
                .setTimestamp();

            // 4. Final Reply
            if (interaction) {
                return await interaction.editReply({ embeds: [balanceEmbed] });
            } else {
                return await message.channel.send({ embeds: [balanceEmbed] });
            }
        } catch (error) {
            console.error("Balance Error:", error);
            const errorMsg = "Something went wrong while fetching balance.";
            if (interaction) return interaction.editReply(errorMsg);
            message.reply(errorMsg);
        }
    },
};