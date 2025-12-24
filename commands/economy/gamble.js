const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_RATE = 0.40; 
const WIN_CHANNEL_ID = "1453089703438975127";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Gamble coins")
        .addIntegerOption(o => o.setName("amount").setDescription("Bet amount").setRequired(true)),

    run: async ({ interaction }) => {
        const amount = interaction.options.getInteger("amount");
        const profile = await UserProfile.findOne({ userId: interaction.user.id });

        if (!profile || profile.balance < amount) return interaction.reply("❌ Low Balance!");

        profile.balance -= amount;
        profile.wageredAmount = (profile.wageredAmount || 0) + amount;

        const isWin = Math.random() < WIN_RATE;
        const embed = new EmbedBuilder().setTitle("Gamble Result");

        if (isWin) {
            profile.balance += (amount * 2);
            profile.wins += 1;
            profile.winAmount += amount;
            embed.setColor('#2ecc71').setDescription(`🎉 Won: **🪙 ${amount}**`);
            const winChan = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
            if (winChan) winChan.send(`🎉 **${interaction.user.username}** won **🪙 ${amount}** in Gamble!`);
        } else {
            embed.setColor('#ff4b2b').setDescription(`💀 Lost: **🪙 ${amount}**`);
        }
        await profile.save();
        return interaction.reply({ embeds: [embed] });
    }
};