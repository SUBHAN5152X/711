const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Check total invite count")
        .addUserOption(opt => opt.setName("user").setDescription("Select a user to check their invites")),

    run: async ({ interaction }) => {
        const target = interaction.options.getUser("user") || interaction.user;
        const data = await UserProfile.findOne({ userId: target.id });
        const count = data?.invites || 0;

        const embed = new EmbedBuilder()
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
            .setTitle("📩 Invite Statistics")
            .setDescription(`**${target.username}** has invited total **${count}** members to the server.`)
            .setColor("#5865F2")
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: "711 Bet • Community Growth" });

        return interaction.reply({ embeds: [embed] });
    }
};