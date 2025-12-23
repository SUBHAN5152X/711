const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const PROFIT_MULTIPLIER = 1.65; // 1.65x Profit (100 -> 265 total)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Play blackjack against the dealer (Win 1.65x Profit)")
        .addIntegerOption(opt => opt.setName("amount").setDescription("Points to bet").setRequired(true)),

    run: async ({ interaction }) => {
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;

        if (amount <= 0) return interaction.reply({ content: "❌ Bet amount must be > 0.", ephemeral: true });

        const profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < amount) return interaction.reply({ content: "❌ Insufficient balance!", ephemeral: true });

        // Bet deduct pehle hi karlo
        profile.balance -= amount;
        await profile.save();

        let deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
        let playerHand = [deck[Math.floor(Math.random() * deck.length)], deck[Math.floor(Math.random() * deck.length)]];
        let dealerHand = [deck[Math.floor(Math.random() * deck.length)], deck[Math.floor(Math.random() * deck.length)]];

        const getSum = (hand) => {
            let sum = hand.reduce((a, b) => a + b, 0);
            if (sum > 21 && hand.includes(11)) sum -= 10; // Ace logic
            return sum;
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
        );

        const createEmbed = (title, color, showDealer = false) => {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `711 Bet: Blackjack`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(title)
                .addFields(
                    { name: 'Your Hand', value: `Cards: \`${playerHand.join(", ")}\` \nTotal: **${getSum(playerHand)}**`, inline: true },
                    { name: 'Dealer Hand', value: showDealer ? `Cards: \`${dealerHand.join(", ")}\` \nTotal: **${getSum(dealerHand)}**` : `Cards: \`${dealerHand[0]}, ?\` \nTotal: **?**`, inline: true }
                )
                .setColor(color)
                .setFooter({ text: `711 Bet • Bet Amount: ${amount}`, iconURL: interaction.client.user.displayAvatarURL() });
            return embed;
        };

        const msg = await interaction.reply({ embeds: [createEmbed('Game Started', '#2b2d31')], components: [row] });

        const filter = i => i.user.id === userId;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                playerHand.push(deck[Math.floor(Math.random() * deck.length)]);
                if (getSum(playerHand) > 21) {
                    collector.stop('bust');
                    return i.update({ embeds: [createEmbed('💀 BUST! You went over 21', '#ff4b2b', true)], components: [] });
                }
                await i.update({ embeds: [createEmbed('Your turn...', '#2b2d31')] });
            } else if (i.customId === 'stand') {
                collector.stop('stand');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'bust') return;

            // Dealer's Turn
            while (getSum(dealerHand) < 17) {
                dealerHand.push(deck[Math.floor(Math.random() * deck.length)]);
            }

            const pSum = getSum(playerHand);
            const dSum = getSum(dealerHand);
            let finalTitle, finalColor;
            const updatedProfile = await UserProfile.findOne({ userId });

            if (dSum > 21 || pSum > dSum) {
                // WIN LOGIC (1.65x Profit)
                const winAmount = Math.floor(amount * (1 + PROFIT_MULTIPLIER)); 
                updatedProfile.balance += winAmount;
                updatedProfile.wins += 1;
                updatedProfile.winAmount += (winAmount - amount); // Pure Profit record in stats
                
                finalTitle = `🎉 YOU WON! Received 🪙 ${winAmount}`;
                finalColor = '#2ecc71';
            } else if (pSum === dSum) {
                // TIE (PUSH)
                updatedProfile.balance += amount; // Refund
                finalTitle = '🤝 PUSH! Points Refunded';
                finalColor = '#f1c40f';
            } else {
                // LOSS
                finalTitle = '💀 DEALER WINS!';
                finalColor = '#ff4b2b';
            }

            await updatedProfile.save();
            await interaction.editReply({ 
                embeds: [createEmbed(finalTitle, finalColor, true)], 
                components: [] 
            });
        });
    },
};