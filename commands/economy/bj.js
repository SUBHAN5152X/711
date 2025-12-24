const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const PAYOUT_MULTIPLIER = 1.65; 
const WIN_CHANNEL_ID = "1453089703438975127";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Play blackjack")
        .addIntegerOption(opt => opt.setName("amount").setDescription("Points to bet").setRequired(true)),

    run: async ({ interaction }) => {
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;

        if (amount <= 0) return interaction.reply({ content: "❌ Bet must be > 0.", ephemeral: true });

        const profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < amount) return interaction.reply({ content: "❌ Insufficient balance!", ephemeral: true });

        // Bet & Wager Tracking
        profile.balance -= amount;
        profile.wageredAmount = (profile.wageredAmount || 0) + amount;
        await profile.save();

        let deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
        let playerHand = [deck[Math.floor(Math.random() * deck.length)], deck[Math.floor(Math.random() * deck.length)]];
        let dealerHand = [deck[Math.floor(Math.random() * deck.length)], deck[Math.floor(Math.random() * deck.length)]];

        const getSum = (hand) => {
            let sum = hand.reduce((a, b) => a + b, 0);
            if (sum > 21 && hand.includes(11)) sum -= 10;
            return sum;
        };

        const createEmbed = (title, color, showDealer = false) => {
            return new EmbedBuilder()
                .setAuthor({ name: `Blackjack - ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(title).setColor(color)
                .addFields(
                    { name: 'Your Hand', value: `Total: **${getSum(playerHand)}**`, inline: true },
                    { name: 'Dealer Hand', value: showDealer ? `Total: **${getSum(dealerHand)}**` : `Total: **?**`, inline: true }
                );
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({ embeds: [createEmbed('Game Started', '#2b2d31')], components: [row] });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                playerHand.push(deck[Math.floor(Math.random() * deck.length)]);
                if (getSum(playerHand) > 21) return collector.stop('bust');
                await i.update({ embeds: [createEmbed('Your turn...', '#2b2d31')] });
            } else if (i.customId === 'stand') collector.stop('stand');
        });

        collector.on('end', async (collected, reason) => {
            const updatedProfile = await UserProfile.findOne({ userId });
            if (reason === 'bust') {
                return interaction.editReply({ embeds: [createEmbed('💀 BUST! You Lost', '#ff4b2b', true)], components: [] });
            }

            while (getSum(dealerHand) < 17) dealerHand.push(deck[Math.floor(Math.random() * deck.length)]);
            const pSum = getSum(playerHand);
            const dSum = getSum(dealerHand);

            if (dSum > 21 || pSum > dSum) {
                const winTotal = Math.floor(amount * PAYOUT_MULTIPLIER);
                updatedProfile.balance += winTotal;
                updatedProfile.wins += 1;
                updatedProfile.winAmount += (winTotal - amount);
                
                interaction.editReply({ embeds: [createEmbed(`🎉 WIN! Received 🪙 ${winTotal}`, '#2ecc71', true)], components: [] });
                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) winChannel.send(`🎉 **${interaction.user.username}** won **🪙 ${winTotal}** in BJ!`);
            } else if (pSum === dSum) {
                updatedProfile.balance += amount;
                interaction.editReply({ embeds: [createEmbed('🤝 PUSH! Refunded', '#f1c40f', true)], components: [] });
            } else {
                interaction.editReply({ embeds: [createEmbed('💀 LOSE!', '#ff4b2b', true)], components: [] });
            }
            await updatedProfile.save();
        });
    }
};