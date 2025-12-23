const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("View your or another user's stats")
        .addUserOption(opt => opt.setName("user").setDescription("User to view stats for")),

    run: async ({ interaction, message }) => {
        const targetUser = (interaction ? interaction.options.getUser("user") : message.mentions.users.first()) || (interaction ? interaction.user : message.author);
        if (interaction) await interaction.deferReply();

        try {
            const profile = await UserProfile.findOne({ userId: targetUser.id }) || { balance: 0, withdrawals: 0, withdrawCount: 0, wins: 0, winAmount: 0, tipsSent: 0, tipsReceived: 0 };

            // USD Conversion (Assuming 100 points = 1$)
            const toUSD = (pts) => (pts / 100).toFixed(2);

            const statsEmbed = new EmbedBuilder()
                .setAuthor({ 
                    name: `crushmminfo: Stats for ${targetUser.username}`, 
                    iconURL: targetUser.displayAvatarURL() 
                })
                .setColor("#2b2d31") // Dark Theme
                .addFields(
                    { 
                        name: '💳 Withdrawals', 
                        value: `**${profile.withdrawals} points** (~$${toUSD(profile.withdrawals)}) (**${profile.withdrawCount} times**)` 
                    },
                    { 
                        name: '🏆 Won', 
                        value: `**${profile.wins} games** and earned **${profile.winAmount.toFixed(2)} points** (~$${toUSD(profile.winAmount)})` 
                    },
                    { 
                        name: '💸 Tips', 
                        value: `Tips sent: **${profile.tipsSent} points**\nTips received: **${profile.tipsReceived} points**` 
                    }
                )
                .setFooter({ 
                    text: "711 Bet", 
                    iconURL: (interaction || message).client.user.displayAvatarURL() 
                })
                .setTimestamp();

            if (interaction) return await interaction.editReply({ embeds: [statsEmbed] });
            return await message.channel.send({ embeds: [statsEmbed] });

        } catch (error) {
            console.error(error);
            const errMsg = "❌ Stats load karne mein error aaya.";
            return interaction ? interaction.editReply(errMsg) : message.reply(errMsg);
        }
    },
};