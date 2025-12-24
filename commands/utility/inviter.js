const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inviter")
        .setDescription("Check who invited you or another user")
        .addUserOption(opt => opt.setName("user").setDescription("Select a user")),

    run: async ({ interaction }) => {
        const target = interaction.options.getUser("user") || interaction.user;
        const data = await UserProfile.findOne({ userId: target.id });
        const inviter = data?.inviterId ? `<@${data.inviterId}>` : "None (Direct Join)";

        const embed = new EmbedBuilder()
            .setTitle("🔗 Inviter Info")
            .setDescription(`**${target.username}** was invited to this server by: ${inviter}`)
            .setColor("#2ecc71")
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};