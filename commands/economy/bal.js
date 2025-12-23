const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bal')
        .setDescription('Check your points balance with a cool card'),

    run: async ({ interaction }) => {
        const userId = interaction.user.id;
        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            return interaction.reply("Aapka profile nahi mila. Pehle kuch game khelein!");
        }

        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext('2d');

        // --- Background (Dark Gradient) ---
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- Decorative Circles (Like RacksBot) ---
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(700, 350, 150, 0, Math.PI * 2);
        ctx.stroke();

        // --- User Avatar (Round) ---
        const avatar = await loadImage(interaction.user.displayAvatarURL({ extension: 'png' }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 100, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 50, 100, 100);
        ctx.restore();

        // --- User Info ---
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(interaction.user.username, 170, 95);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`ID: ${userId}`, 170, 125);

        // --- Balance Text ---
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('POINTS BALANCE', 400, 240);

        ctx.fillStyle = '#3b82f6'; // Blue color for balance
        ctx.font = 'bold 80px sans-serif';
        ctx.fillText(`${userProfile.balance.toFixed(2)}`, 400, 320);

        // --- Footer (711 Bet) ---
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('711 Bet', 50, 410); // Aapka name yahan set hai

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'balance.png' });
        
        return interaction.reply({ files: [attachment] });
    },
};