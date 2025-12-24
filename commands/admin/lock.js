const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Channel ko lock karein taaki koi msg na kar sake")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // Sirf staff ko dikhega

    run: async ({ interaction }) => {
        const channel = interaction.channel;

        try {
            // @everyone ki send message permission band karna
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            const lockEmbed = new EmbedBuilder()
                .setTitle("🔒 Channel Locked")
                .setDescription(`Is channel ko **${interaction.user.username}** ne lock kar diya hai.\nAb yahan koi msg nahi kar sakta.`)
                .setColor("#ff3e3e")
                .setFooter({ text: "711 Bet • Security" })
                .setTimestamp();

            await interaction.reply({ embeds: [lockEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Error: Channel lock karne mein dikat aayi.", flags: [64] });
        }
    },
};