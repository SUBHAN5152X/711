const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward points'),

    run: async ({ interaction, message }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        try {
            let userProfile = await UserProfile.findOne({ userId: user.id });

            if (!userProfile) {
                userProfile = new UserProfile({ userId: user.id, balance: 0 });
            }

            // --- Condition: 1 Point Check ---
            if (userProfile.balance < 1) {
                const errEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Unable to Claim Daily Reward`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ **Minimum 1 point in balance required**\nYour current balance: 🪙 ${userProfile.balance.toFixed(2)}`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });

                return interaction ? interaction.editReply({ embeds: [errEmbed] }) : message.reply({ embeds: [errEmbed] });
            }

            // --- Cooldown Check (24h) ---
            const cooldown = 24 * 60 * 60 * 1000;
            const lastDaily = userProfile.lastDaily || 0;
            if (Date.now() - lastDaily < cooldown) {
                const timeLeft = cooldown - (Date.now() - lastDaily);
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                return (interaction || message).reply(`⌛ Wait **${hours}h** to claim again!`);
            }

            // --- Reward Update ---
            userProfile.balance += 50;
            userProfile.lastDaily = Date.now();
            await userProfile.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Daily Reward Claimed!`, iconURL: user.displayAvatarURL() })
                .setDescription(`🎉 You claimed your daily **🪙 50 points**!`)
                .addFields({ name: '💰 New Balance', value: `## 🪙 ${userProfile.balance.toFixed(2)}` })
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            if (interaction) return await interaction.editReply({ embeds: [successEmbed] });
            return await message.channel.send({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            if (interaction) interaction.editReply("Something went wrong!");
        }
    },
};