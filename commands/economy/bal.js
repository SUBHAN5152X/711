const { AttachmentBuilder, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bal')
        .setDescription('Check your points balance'),

    run: async ({ interaction, message }) => {
        const user = interaction ? interaction.user : message.author;
        const userId = user.id;

        let userProfile = await UserProfile.findOne({ userId });
        if (!userProfile) return (interaction || message).reply("Pehle kuch game khelein!");

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Background Color (Dark Theme)
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decorative Circle
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(750, 350, 100, 0, Math.PI * 2);
        ctx.stroke();

        // Points Balance Text
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('POINTS BALANCE', 400, 180);

        // Large Blue Balance
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 90px sans-serif';
        ctx.fillText(`${userProfile.balance.toFixed(2)}`, 400, 280);

        // Footer Brand
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 25px sans-serif';
        ctx.fillText('711 Bet', 40, 370);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'balance.png' });
        
        // Image ke upar embed message (RacksBot style)
        const embed = new EmbedBuilder()
            .setTitle(`crushmminfo: ${user.username}'s Balance`)
            .setDescription(`${userProfile.balance} points | 0 LTC | $N/A`)
            .setColor('#3b82f6')
            .setImage('attachment://balance.png');

        if (interaction) {
            return interaction.reply({ embeds: [embed], files: [attachment] });
        } else {
            return message.channel.send({ embeds: [embed], files: [attachment] });
        }
    },
};
