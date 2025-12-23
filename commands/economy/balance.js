const { SlashCommandBuilder } = require('discord.js');
const balCommand = require('./bal'); // Apne bal.js ka path sahi check kar lena

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('View your current points (Alias)'),

    run: async (context) => {
        // Ye seedha bal.js ka function chala dega
        return await balCommand.run(context);
    },
};