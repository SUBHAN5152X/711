const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Get the LTC deposit address in your DMs"),

    run: async ({ interaction }) => {
        const user = interaction.user;
        const serverLogo = interaction.guild.iconURL();
        const botLogo = interaction.client.user.displayAvatarURL();

        // 1. Professional DM Embed
        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: `711 Bet: Deposit Information`, iconURL: serverLogo })
            .setThumbnail(serverLogo)
            .setColor("#3498db")
            .setDescription(
                `Hello **${user.username}**,\n\n` +
                `To add points to your balance, please deposit **LTC** to the address below:\n\n` +
                `**LTC Address:**\n\`ltc1q3ykla2dz8hw3njmszmnr7auvnm949j5kru49qm\`\n\n` +
                `**Instructions:**\n` +
                `If you are suffering from any kind of issue , \n Please create a ticket in <#1453079340660031720> .`
            )
            .setFooter({ text: "711 Bet • Secure Deposits", iconURL: botLogo })
            .setTimestamp();

        try {
            // Attempt to send DM
            await user.send({ embeds: [dmEmbed] });

            // Public Response in English
            return await interaction.reply({ 
                content: `📩 **Check Your DM, ${user.username}!**`, 
                flags: [64] 
            });

        } catch (error) {
            // Handle Closed DMs in English
            return await interaction.reply({ 
                content: `❌ **${user.username}**, I couldn't send you a DM. Please enable **DMs** in your server privacy settings.`, 
                flags: [64] 
            });
        }
    },
};