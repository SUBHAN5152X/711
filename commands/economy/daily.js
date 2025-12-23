const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile"); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily 1 point reward'),

    run: async ({ interaction, message }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        try {
            let userProfile = await UserProfile.findOne({ userId: user.id });
            if (!userProfile) {
                userProfile = new UserProfile({ userId: user.id, balance: 0, lastDaily: 0 });
            }

            // --- 1. Cooldown Check (Sabse Pehle) ---
            const dailyCooldown = 24 * 60 * 60 * 1000; // 24 Hours in ms
            const lastClaimed = userProfile.lastDaily || 0;
            const currentTime = Date.now();

            if (currentTime - lastClaimed < dailyCooldown) {
                const nextClaimTime = lastClaimed + dailyCooldown;
                const timeRemaining = nextClaimTime - currentTime;
                
                const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

                const waitEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Daily Reward Already Claimed`, iconURL: user.displayAvatarURL() })
                    .setDescription(`⌛ Aap pehle hi claim kar chuke hain!\n\nWapas aaiye: **${hours}h ${minutes}m** baad.`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });

                return interaction ? interaction.editReply({ embeds: [waitEmbed] }) : message.reply({ embeds: [waitEmbed] });
            }

            // --- 2. Balance Check (Min 1 Point) ---
            if (userProfile.balance < 1) {
                const errEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Unable to Claim Daily Reward`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ **Minimum 1 point in balance required** to claim daily reward.`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });
                
                return interaction ? interaction.editReply({ embeds: [errEmbed] }) : message.reply({ embeds: [errEmbed] });
            }

            // --- 3. Update Database (Atomic Update) ---
            userProfile.balance += 1;
            userProfile.lastDaily = currentTime;
            await userProfile.save();

            const scsEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Daily Reward Claimed!`, iconURL: user.displayAvatarURL() })
                .setDescription(`🎉 You claimed your daily **🪙 1.00 point**!`)
                .addFields({ name: '💰 New Balance', value: `## 🪙 ${userProfile.balance.toFixed(2)}` })
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            return interaction ? await interaction.editReply({ embeds: [scsEmbed] }) : await message.channel.send({ embeds: [scsEmbed] });

        } catch (error) {
            console.error("Daily Error:", error);
            if (interaction) interaction.editReply("Kuch galti hui, baad mein try karein.");
        }
    },
};