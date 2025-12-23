const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bal')
        .setDescription('Check your points balance'),

    run: async ({ interaction, message }) => {
        const user = interaction ? interaction.user : message.author;
        const userId = user.id;

        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            const noProfile = "❌ Aapka profile nahi mila. Pehle kuch game khelein!";
            return interaction ? interaction.reply(noProfile) : message.reply(noProfile);
        }

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

        if (interaction) {
            return interaction.reply({ embeds: [balanceEmbed] });
        } else {
            return message.channel.send({ embeds: [balanceEmbed] });
        }
    },
};
