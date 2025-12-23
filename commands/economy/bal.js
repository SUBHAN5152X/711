const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bal')
        .setDescription('View your current points and financial status'),

    run: async ({ interaction, message }) => {
        // Timeout se bachne ke liye
        if (interaction) await interaction.deferReply();

        try {
            const user = interaction ? interaction.user : message.author;
            const userId = user.id;

            let userProfile = await UserProfile.findOne({ userId });

            if (!userProfile) {
                const noAccount = "❌ **Account Not Found!** Play a game first to create one.";
                return interaction ? interaction.editReply(noAccount) : message.reply(noAccount);
            }

            // --- OP Embed Design ---
            const balEmbed = new EmbedBuilder()
                .setColor('#00ffcc') // Premium Cyan Color
                .setAuthor({ 
                    name: `crushmminfo: ${user.username}'s Bank`, 
                    iconURL: user.displayAvatarURL({ dynamic: true }) 
                })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(`> 🪙 **Financial Overview for <@${userId}>**`)
                .addFields(
                    { name: '💰 Current Balance', value: `## 🪙 ${userProfile.balance.toLocaleString()} Points`, inline: false },
                    { name: '💎 Assets', value: `\`LTC:\` 0.0000\n\`USD:\` $${(userProfile.balance / 100).toFixed(2)}`, inline: true },
                    { name: '📊 Statistics', value: `\`Rank:\` Member\n\`Status:\` Active`, inline: true },
                    { name: '━━━━━━━━━━━━━━━━━━━━━━━━', value: ' ' }
                )
                .setFooter({ text: '711 Bet • Powered by Quantum Tech', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            if (interaction) {
                return await interaction.editReply({ embeds: [balEmbed] });
            } else {
                return await message.channel.send({ embeds: [balEmbed] });
            }

        } catch (error) {
            console.error("Balance Command Error:", error);
            const errMsg = "⚠️ An error occurred while fetching your balance.";
            if (interaction) return interaction.editReply(errMsg);
            message.reply(errMsg);
        }
    },
};