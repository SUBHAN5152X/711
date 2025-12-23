const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Shows a user their balance"),

    run: async ({ interaction, message }) => {
        // Determine the user (slash or prefix)
        const user = interaction ? interaction.user : message.author;
        const userId = user.id;

        let userProfile = await UserProfile.findOne({ userId });

        const balance = userProfile ? userProfile.balance : 0;

        const reply = `${user.username} has **${balance} coins**`;

        // Reply depending on the type of command
        if (interaction) {
            await interaction.reply(reply);
        } else if (message) {
            await message.channel.send(reply);
        }
    },
};
