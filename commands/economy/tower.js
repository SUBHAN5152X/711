const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_CHANNEL_ID = "1453089703438975127";
const MIN_BET = 7;

// Multipliers for each level (The higher you go, the more you win)
const MULTIPLIERS = [1.45, 2.18, 3.27, 4.91, 7.36, 11.05, 16.57, 24.86];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tower")
        .setDescription("Climb the tower to win big!")
        .addIntegerOption(o => o.setName("bet").setDescription("Amount to bet (Min 7)").setRequired(true)),

    run: async ({ interaction }) => {
        const bet = interaction.options.getInteger("bet");
        const userId = interaction.user.id;

        // 1. Validations
        if (bet < MIN_BET) return interaction.reply({ content: `❌ Minimum bet is ${MIN_BET} coins.`, flags: [64] });

        let profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < bet) return interaction.reply({ content: "❌ Insufficient balance!", flags: [64] });

        // 2. Initial Setup
        profile.balance -= bet;
        profile.wageredAmount = (profile.wageredAmount || 0) + bet;
        await profile.save();

        let currentLevel = 0; // Starts at Level 1 (index 0)
        let gameOver = false;
        let isCashedOut = false;

        // Generate the tower (Each level has 1 Diamond at a random position 0, 1, or 2)
        const towerData = Array.from({ length: 8 }, () => Math.floor(Math.random() * 3));

        const createEmbed = () => {
            let towerDisplay = "";
            for (let i = 7; i >= 0; i--) {
                const levelPrefix = i === currentLevel && !gameOver ? "➡️ " : "      ";
                const levelStatus = i < currentLevel ? "✅ Completed" : (i === currentLevel && !gameOver ? "**Current Level**" : "🔒 Locked");
                towerDisplay += `${levelPrefix}**Level ${i + 1}** (x${MULTIPLIERS[i].toFixed(2)}) - ${levelStatus}\n`;
            }

            return new EmbedBuilder()
                .setAuthor({ name: `${interaction.user.username}'s Tower Climb`, iconURL: interaction.user.displayAvatarURL() })
                .setColor(gameOver ? "#ff4b2b" : (isCashedOut ? "#2ecc71" : "#3498db"))
                .setDescription(`**Bet:** 🪙 ${bet}\n**Multiplier:** x${(currentLevel > 0 ? MULTIPLIERS[currentLevel - 1] : 1.00).toFixed(2)}\n\n${towerDisplay}`)
                .setFooter({ text: "Pick one of the 3 buttons to climb higher!" });
        };

        const createRows = (disabled = false) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("tower_0").setLabel("Left").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
                new ButtonBuilder().setCustomId("tower_1").setLabel("Middle").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
                new ButtonBuilder().setCustomId("tower_2").setLabel("Right").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
            );

            const controlRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("tower_cashout")
                    .setLabel(`Cashout (🪙 ${Math.floor(bet * (currentLevel > 0 ? MULTIPLIERS[currentLevel - 1] : 1.00))})`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(currentLevel === 0 || disabled || gameOver)
            );
            return [row, controlRow];
        };

        const msg = await interaction.reply({ embeds: [createEmbed()], components: createRows() });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 60000 });

        collector.on("collect", async i => {
            if (i.customId.startsWith("tower_")) {
                const choice = parseInt(i.customId.split("_")[1]);

                if (i.customId === "tower_cashout") {
                    isCashedOut = true;
                    return collector.stop("cashout");
                }

                // Check if hit diamond or bomb
                if (choice === towerData[currentLevel]) {
                    currentLevel++;
                    if (currentLevel === 8) return collector.stop("win");
                    
                    await i.update({ embeds: [createEmbed()], components: createRows() });
                } else {
                    gameOver = true;
                    collector.stop("lose");
                }
            }
        });

        collector.on("end", async (collected, reason) => {
            let userProfile = await UserProfile.findOne({ userId });
            let finalMult = currentLevel > 0 ? MULTIPLIERS[currentLevel - 1] : 0;
            let winAmount = Math.floor(bet * finalMult);

            if (reason === "cashout" || reason === "win") {
                userProfile.balance += winAmount;
                userProfile.wins += 1;
                userProfile.winAmount += (winAmount - bet);
                await userProfile.save();

                const winEmbed = createEmbed()
                    .setTitle(reason === "win" ? "🏆 TOWER CONQUERED!" : "💰 CASHOUT SUCCESS")
                    .setDescription(`You climbed to Level **${currentLevel}** and won **🪙 ${winAmount}**!`);
                
                await interaction.editReply({ embeds: [winEmbed], components: [] });

                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel && winAmount > bet) {
                    winChannel.send(`🚀 **${interaction.user.username}** climbed the Tower and won **🪙 ${winAmount}**!`);
                }
            } else {
                const loseEmbed = createEmbed()
                    .setTitle("💥 BOOM! YOU FELL")
                    .setDescription(`You hit a bomb at Level **${currentLevel + 1}** and lost your bet.`);
                
                await interaction.editReply({ embeds: [loseEmbed], components: [] });
            }
        });
    }
};