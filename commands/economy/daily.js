const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward'),

    run: async ({ interaction, message }) => {
        if (interaction) await interaction.deferReply();
        const user = interaction ? interaction.user : message.author;

        try {
            let userProfile = await UserProfile.findOne({ userId: user.id }) || new UserProfile({ userId: user.id, balance: 0 });

            // Condition: Min 1 point required
            if (userProfile.balance < 1) {
                const errEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Unable to Claim Daily Reward`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ **Minimum 1 point in balance required**`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });
                return interaction ? interaction.editReply({ embeds: [errEmbed] }) : message.reply({ embeds: [errEmbed] });
            }

            // Cooldown check
            const cooldown = 24 * 60 * 60 * 1000;
            if (Date.now() - (userProfile.lastDaily || 0) < cooldown) return (interaction || message).reply("⌛ Wait 24h!");

            userProfile.balance += 50;
            userProfile.lastDaily = Date.now();
            await userProfile.save();

            const scsEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Daily Reward Claimed!`, iconURL: user.displayAvatarURL() })
                .setDescription(`🎉 You claimed **🪙 50 points**!`)
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            return interaction ? await interaction.editReply({ embeds: [scsEmbed] }) : await message.channel.send({ embeds: [scsEmbed] });
        } catch (e) { console.log(e); }
    },
};