const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile"); // Path set to 2 dots

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily 1 point reward'),

    run: async ({ interaction, message }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        try {
            let userProfile = await UserProfile.findOne({ userId: user.id }) || new UserProfile({ userId: user.id, balance: 0 });

            // --- Condition: Balance 1 point se kam nahi hona chahiye claim karne ke liye ---
            if (userProfile.balance < 1) {
                const errEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Unable to Claim Daily Reward`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ **Minimum 1 point in balance required**`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });
                return interaction ? interaction.editReply({ embeds: [errEmbed] }) : message.reply({ embeds: [errEmbed] });
            }

            // --- Cooldown Check (24h) ---
            const cooldown = 24 * 60 * 60 * 1000;
            if (Date.now() - (userProfile.lastDaily || 0) < cooldown) {
                return (interaction || message).reply("⌛ **Wait 24h!** Rozana sirf ek baar claim kar sakte hain.");
            }

            // --- Reward: Ab sirf 1 point milega ---
            userProfile.balance += 1; 
            userProfile.lastDaily = Date.now();
            await userProfile.save();

            const scsEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Daily Reward Claimed!`, iconURL: user.displayAvatarURL() })
                .setDescription(`🎉 You claimed your daily **🪙 1.00 point**!`)
                .addFields({ name: '💰 New Balance', value: `## 🪙 ${userProfile.balance.toFixed(2)}` })
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            return interaction ? await interaction.editReply({ embeds: [scsEmbed] }) : await message.channel.send({ embeds: [scsEmbed] });
        } catch (e) { console.error(e); }
    },
};