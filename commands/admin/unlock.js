const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unlock")
        .setDescription("Locked channel ko wapas open karein")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    run: async ({ interaction }) => {
        const channel = interaction.channel;

        try {
            // Permission wapas null ya true karna
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null // Null matlab server level settings follow hongi
            });

            const unlockEmbed = new EmbedBuilder()
                .setTitle("🔓 Channel Unlocked")
                .setDescription(`Is channel ko wapas open kar diya gaya hai. Ab sab msg kar sakte hain.`)
                .setColor("#2ecc71")
                .setFooter({ text: "711 Bet • Security" })
                .setTimestamp();

            await interaction.reply({ embeds: [unlockEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Error: Channel unlock nahi ho paya.", flags: [64] });
        }
    },
};