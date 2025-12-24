const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invited")
        .setDescription("Check the list of users invited by someone")
        .addUserOption(opt => opt.setName("user").setDescription("Select a user")),

    run: async ({ interaction }) => {
        const target = interaction.options.getUser("user") || interaction.user;
        
        // Database mein un logo ko dhundo jinka inviterId target ki ID hai
        const invitedUsers = await UserProfile.find({ inviterId: target.id });
        
        let description = invitedUsers.length 
            ? invitedUsers.map((u, i) => `**${i + 1}.** <@${u.userId}>`).join("\n")
            : "No users invited yet.";

        const embed = new EmbedBuilder()
            .setTitle(`👥 Users Invited by ${target.username}`)
            .setDescription(description)
            .setColor("#f1c40f")
            .setFooter({ text: `Total: ${invitedUsers.length}` });

        return interaction.reply({ embeds: [embed] });
    }
};