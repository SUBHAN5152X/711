const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Showing top 10 wagerers"),

    run: async ({ interaction, message }) => {
        if (interaction) await interaction.deferReply();

        try {
            // Top 10 users with highest balance fetch karein
            const topUsers = await UserProfile.find().sort({ balance: -1 }).limit(10);

            if (!topUsers.length) {
                return (interaction || message).reply("❌ No data available.");
            }

            let description = "";
            for (let i = 0; i < topUsers.length; i++) {
                const userData = topUsers[i];
                const userObj = await (interaction || message).client.users.fetch(userData.userId).catch(() => null);
                const userName = userObj ? userObj.username : "Unknown";
                
                // RacksGG Style Ranking Icons
                const rank = i + 1;
                let rankStyle = `**${rank}**`;
                if (rank === 1) rankStyle = "🥇";
                else if (rank === 2) rankStyle = "🥈";
                else if (rank === 3) rankStyle = "🥉";

                description += `${rankStyle}  **${userName}** —  \`🪙 ${userData.balance.toLocaleString()} points\`\n`;
            }

            // Image jaisa Embed Design
            const lbEmbed = new EmbedBuilder()
                .setAuthor({ 
                    name: `crushmminfo: Leaderboard`, 
                    iconURL: (interaction || message).client.user.displayAvatarURL() 
                })
                .setTitle("Showing top 10 wagerers: Daily") // Header match
                .setDescription(description)
                .setColor("#2b2d31") // Dark background match
                .setFooter({ 
                    text: "711 Bet • Resets in 5 hours", 
                    iconURL: (interaction || message).client.user.displayAvatarURL() 
                })
                .setTimestamp();

            if (interaction) return await interaction.editReply({ embeds: [lbEmbed] });
            return await message.channel.send({ embeds: [lbEmbed] });

        } catch (error) {
            console.error(error);
            if (interaction) interaction.editReply("Error loading leaderboard.");
        }
    },
};