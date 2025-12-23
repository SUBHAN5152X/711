const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bal')
        .setDescription('Check your points balance with a cool card'),

    run: async ({ interaction, message }) => {
        // Slash aur Prefix dono support ke liye
        const user = interaction ? interaction.user : message.author;
        const userId = user.id;

        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            const errorMsg = "Aapka profile nahi mila. Pehle kuch game khelein!";
            return interaction ? interaction.reply(errorMsg) : message.reply(errorMsg);
        }

        // Canvas Setup (RacksBot jaisa size)
        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext('2d');

        // --- Background (Dark Gradient) ---
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#0f172a'); // Dark blue/black
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- User Avatar (Circle) ---
        try {
            const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
            const avatar = await loadImage(avatarURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 100, 50, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 50, 50, 100, 100);
            ctx.restore();
        } catch (e) {
            console.log("Avatar load nahi hua, default use kar rahe hain");
        }

        // --- User Info ---
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(user.username, 170, 95);
        
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`ID: ${userId}`, 170, 125);

        // --- Balance Section ---
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('POINTS BALANCE', 400, 240);

        ctx.fillStyle = '#3b82f6'; // Bright Blue
        ctx.font = 'bold 80px sans-serif';
        ctx.fillText(`${userProfile.balance.toFixed(2)}`, 400, 320);

        // --- Footer (711 Bet) ---
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('711 Bet', 50, 410); // Aapka brand name

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'balance.png' });
        
        if (interaction) {
            return interaction.reply({ files: [attachment] });
        } else {
            return message.channel.send({ files: [attachment] });
        }
    },
};
