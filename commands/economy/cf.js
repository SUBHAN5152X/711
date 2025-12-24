const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const MULTIPLIER = 1.75; 
const WIN_CHANNEL_ID = "1453089703438975127";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cf")
        .setDescription("Coinflip")
        .addStringOption(o => o.setName("side").setDescription("Heads/Tails").setRequired(true).addChoices({name:"Heads",value:"heads"},{name:"Tails",value:"tails"}))
        .addIntegerOption(o => o.setName("amount").setDescription("Bet amount").setRequired(true)),

    run: async ({ interaction }) => {
        const side = interaction.options.getString("side");
        const amount = interaction.options.getInteger("amount");
        const profile = await UserProfile.findOne({ userId: interaction.user.id });

        if (!profile || profile.balance < amount) return interaction.reply("❌ Low Balance!");

        profile.balance -= amount;
        profile.wageredAmount = (profile.wageredAmount || 0) + amount;
        
        const result = Math.random() < 0.5 ? "heads" : "tails";
        const isWin = side === result;
        const embed = new EmbedBuilder().setAuthor({name: `Coinflip Result`, iconURL: interaction.user.displayAvatarURL()});

        if (isWin) {
            const winTotal = Math.floor(amount * MULTIPLIER);
            profile.balance += winTotal;
            profile.wins += 1;
            profile.winAmount += (winTotal - amount);
            embed.setColor('#2ecc71').setDescription(`🪙 Landed: **${result}**\n🎉 Won: **🪙 ${winTotal}**`);
            const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
            if (winChannel) winChannel.send(`🎉 **${interaction.user.username}** won **🪙 ${winTotal}** in CF!`);
        } else {
            embed.setColor('#ff4b2b').setDescription(`🪙 Landed: **${result}**\n💀 Lost: **🪙 ${amount}**`);
        }
        await profile.save();
        return interaction.reply({ embeds: [embed] });
    }
};