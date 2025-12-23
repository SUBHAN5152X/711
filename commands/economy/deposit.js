const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Get information on how to deposit points"),

    run: async ({ interaction, message }) => {
        const depositEmbed = new EmbedBuilder()
            .setAuthor({ 
                name: `crushmminfo: Deposit Points`, 
                iconURL: (interaction ? interaction.user : message.author).displayAvatarURL() 
            })
            .setDescription(`💳 Go in <#1453079340660031720> to deposit !`)
            .setColor("#2b2d31") // Dark Premium Theme
            .setFooter({ 
                text: "711 Bet", 
                iconURL: (interaction || message).client.user.displayAvatarURL() 
            })
            .setTimestamp();

        if (interaction) {
            return await interaction.reply({ embeds: [depositEmbed] });
        } else {
            return await message.channel.send({ embeds: [depositEmbed] });
        }
    },
};