const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View top wagerers in the server"),

    run: async ({ interaction }) => {
        await interaction.deferReply();

        try {
            // Top 10 users by wageredAmount
            const topWagerers = await UserProfile.find()
                .sort({ wageredAmount: -1 })
                .limit(10);

            if (!topWagerers.length) {
                return interaction.editReply("Leaderboard abhi khali hai!");
            }

            const leaderboardEmbed = new EmbedBuilder()
                .setAuthor({ name: '711 Bet: Top Wagerers', iconURL: interaction.guild.iconURL() })
                .setColor('#f1c40f') // Gold Color
                .setFooter({ text: '711 Bet • High Rollers Only' })
                .setTimestamp();

            let description = "";
            for (let i = 0; i < topWagerers.length; i++) {
                const user = await interaction.client.users.fetch(topWagerers[i].userId).catch(() => null);
                const tag = user ? user.username : "Unknown User";
                const amount = topWagerers[i].wageredAmount || 0;
                
                // Top 3 ke liye emojis
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
                description += `${medal} **${tag}** — 🪙 \`${amount.toFixed(2)}\` wagered\n`;
            }

            leaderboardEmbed.setDescription(description || "No data available.");

            return await interaction.editReply({ embeds: [leaderboardEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.editReply("Leaderboard load karne mein error aaya.");
        }
    },
};