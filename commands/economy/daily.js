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
            // 1. Database se user uthao, agar nahi hai toh naya banao
            let userProfile = await UserProfile.findOne({ userId: user.id });
            if (!userProfile) {
                userProfile = new UserProfile({ userId: user.id, balance: 0, lastDaily: 0 });
                await userProfile.save();
            }

            // 2. Cooldown calculation
            const dailyCooldown = 24 * 60 * 60 * 1000; 
            const lastClaimed = userProfile.lastDaily || 0;
            const timeLeft = dailyCooldown - (Date.now() - lastClaimed);

            // 3. Agar time bacha hai toh seedha rok do
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                const waitEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Already Claimed`, iconURL: user.displayAvatarURL() })
                    .setDescription(`⌛ **Aap claim kar chuke hain!**\n\nWapas aaiye: **${hours}h ${minutes}m** baad.`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });

                return interaction ? interaction.editReply({ embeds: [waitEmbed] }) : message.reply({ embeds: [waitEmbed] });
            }

            // 4. Min Balance Check
            if (userProfile.balance < 1) {
                const errEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Low Balance`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ Daily claim karne ke liye kam se kam **🪙 1.00 point** hona chahiye.`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });
                
                return interaction ? interaction.editReply({ embeds: [errEmbed] }) : message.reply({ embeds: [errEmbed] });
            }

            // 5. Reward dena aur TIME SAVE KARNA (Atomic Update)
            // Hum .findOneAndUpdate use karenge taaki data turant lock ho jaye
            await UserProfile.findOneAndUpdate(
                { userId: user.id },
                { 
                    $inc: { balance: 1 }, 
                    $set: { lastDaily: Date.now() } 
                },
                { new: true }
            );

            const scsEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Daily Reward Claimed!`, iconURL: user.displayAvatarURL() })
                .setDescription(`🎉 You claimed **🪙 1.00 point**!`)
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            return interaction ? await interaction.editReply({ embeds: [scsEmbed] }) : await message.channel.send({ embeds: [scsEmbed] });

        } catch (error) {
            console.error(error);
            if (interaction) interaction.editReply("Database error!");
        }
    },
};