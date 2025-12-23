const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const PAYOUT_MULTIPLIER = 1.65; 
const WIN_CHANNEL_ID = "1453089703438975127"; // Aapka announcement channel

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Play blackjack (Win 1.65x Total Payout)")
        .addIntegerOption(opt => opt.setName("amount").setDescription("Points to bet").setRequired(true)),

    run: async ({ interaction }) => {
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;

        if (amount <= 0) return interaction.reply({ content: "❌ Bet amount must be > 0.", ephemeral: true });

        const profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < amount) return interaction.reply({ content: "❌ Insufficient balance!", ephemeral: true });

        profile.balance -= amount;
        await profile.save();

        let deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
        let playerHand = [deck[Math.floor(Math.random() * deck.length)], deck[Math.floor(Math.random() * deck.length)]];
        let dealerHand = [deck[Math.floor(Math.random() * deck.length)], deck[Math.floor(Math.random() * deck.length)]];

        const getSum = (hand) => {
            let sum = hand.reduce((a, b) => a + b, 0);
            if (sum > 21 && hand.includes(11)) sum -= 10;
            return sum;
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
        );

        const createEmbed = (title, color, showDealer = false) => {
            return new EmbedBuilder()
                .setAuthor({ name: `711 Bet: Blackjack`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(title)
                .addFields(
                    { name: 'Your Hand', value: `Cards: \`${playerHand.join(", ")}\` \nTotal: **${getSum(playerHand)}**`, inline: true },
                    { name: 'Dealer Hand', value: showDealer ? `Cards: \`${dealerHand.join(", ")}\` \nTotal: **${getSum(dealerHand)}**` : `Cards: \`${dealerHand[0]}, ?\` \nTotal: **?**`, inline: true }
                )
                .setColor(color)
                .setFooter({ text: `711 Bet • Bet: ${amount}`, iconURL: interaction.client.user.displayAvatarURL() });
        };

        const msg = await interaction.reply({ embeds: [createEmbed('Game Started', '#2b2d31')], components: [row] });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'hit') {
                playerHand.push(deck[Math.floor(Math.random() * deck.length)]);
                if (getSum(playerHand) > 21) {
                    collector.stop('bust');
                    return i.update({ embeds: [createEmbed('💀 BUST!', '#ff4b2b', true)], components: [] });
                }
                await i.update({ embeds: [createEmbed('Your turn...', '#2b2d31')] });
            } else if (i.customId === 'stand') collector.stop('stand');
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'bust') return;
            while (getSum(dealerHand) < 17) dealerHand.push(deck[Math.floor(Math.random() * deck.length)]);

            const pSum = getSum(playerHand);
            const dSum = getSum(dealerHand);
            let finalTitle, finalColor;
            const updatedProfile = await UserProfile.findOne({ userId });

            if (dSum > 21 || pSum > dSum) {
                const winTotal = Math.floor(amount * PAYOUT_MULTIPLIER);
                updatedProfile.balance += winTotal;
                updatedProfile.wins += 1;
                updatedProfile.winAmount += (winTotal - amount); 
                
                finalTitle = `🎉 WIN! Received 🪙 ${winTotal}`;
                finalColor = '#2ecc71';

                // --- Announcement Logic ---
                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) {
                    winChannel.send(`🎉 **${interaction.user.username}** has just won **🪙 ${winTotal}** in **Blackjack** !!`);
                }
            } else if (pSum === dSum) {
                updatedProfile.balance += amount; 
                finalTitle = '🤝 PUSH! Refunded';
                finalColor = '#f1c40f';
            } else {
                finalTitle = '💀 LOSE!';
                finalColor = '#ff4b2b';
            }

            await updatedProfile.save();
            await interaction.editReply({ embeds: [createEmbed(finalTitle, finalColor, true)], components: [] });
        });
    },
};