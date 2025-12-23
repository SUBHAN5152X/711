const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward'),

    run: async ({ interaction, message }) => {
        if (interaction) await interaction.deferReply();

        try {
            const user = interaction ? interaction.user : message.author;
            const userId = user.id;

            let userProfile = await UserProfile.findOne({ userId });

            if (!userProfile) {
                userProfile = new UserProfile({ userId, balance: 0 });
            }

            // --- Condition Check (Min 1 Point) ---
            if (userProfile.balance < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Unable to Claim Daily Reward`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ **Minimum 1 point in balance required**\nYour current balance is 🪙 ${userProfile.balance}`)
                    .setColor('#ff4b2b') // Red color for error
                    .setFooter({ text: '711 Bet' });

                return interaction ? interaction.editReply({ embeds: [errorEmbed] }) : message.reply({ embeds: [errorEmbed] });
            }

            // --- Cooldown Logic (24 Hours) ---
            const lastDaily = userProfile.lastDaily || 0;
            const currentTime = Date.now();
            const cooldown = 24 * 60 * 60 * 1000; // 24 Ghante

            if (currentTime - lastDaily < cooldown) {
                const timeLeft = cooldown - (currentTime - lastDaily);
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                return interaction ? 
                    interaction.editReply(`⌛ Wait **${hours}h ${minutes}m** to claim again!`) : 
                    message.reply(`⌛ Wait **${hours}h ${minutes}m** to claim again!`);
            }

            // --- Reward Denewala Logic ---
            const reward = 50; // Rozana 50 points (Aap change kar sakte ho)
            userProfile.balance += reward;
            userProfile.lastDaily = currentTime;
            await userProfile.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Daily Reward Claimed!`, iconURL: user.displayAvatarURL() })
                .setDescription(`🎉 You claimed your daily **🪙 ${reward} points**!`)
                .addFields({ name: '💰 New Balance', value: `🪙 ${userProfile.balance.toFixed(2)}` })
                .setColor('#00ffcc') // Success Cyan color
                .setFooter({ text: '711 Bet • Come back tomorrow!' })
                .setTimestamp();

            if (interaction) {
                return await interaction.editReply({ embeds: [successEmbed] });
            } else {
                return await message.channel.send({ embeds: [successEmbed] });
            }

        } catch (error) {
            console.error("Daily Command Error:", error);
            if (interaction) interaction.editReply("Something went wrong!");
        }
    },
};