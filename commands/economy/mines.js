const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_CHANNEL_ID = "1453089703438975127";
const MIN_BET = 7;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mines")
        .setDescription("Play Mines and multiply your coins")
        .addIntegerOption(o => o.setName("bet").setDescription("Amount to bet (Min 7)").setRequired(true))
        .addIntegerOption(o => o.setName("mines").setDescription("Number of mines (3-24)").setRequired(true)),

    run: async ({ interaction }) => {
        const bet = interaction.options.getInteger("bet");
        const minesCount = interaction.options.getInteger("mines");
        const userId = interaction.user.id;

        if (bet < MIN_BET) return interaction.reply({ content: `❌ Minimum bet is ${MIN_BET} coins.`, flags: [64] });
        if (minesCount < 3 || minesCount > 24) return interaction.reply({ content: `❌ Mines must be between 3 and 24.`, flags: [64] });

        let profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < bet) return interaction.reply({ content: "❌ Insufficient balance!", flags: [64] });

        profile.balance -= bet;
        profile.wageredAmount = (profile.wageredAmount || 0) + bet;
        await profile.save();

        let grid = Array(25).fill("diamond");
        let placedMines = 0;
        while (placedMines < minesCount) {
            let index = Math.floor(Math.random() * 25);
            if (grid[index] !== "mine") { grid[index] = "mine"; placedMines++; }
        }

        let revealed = Array(25).fill(false);
        let diamondsFound = 0;
        let gameOver = false;

        const calculateMultiplier = () => {
            let n = 25, m = minesCount, d = diamondsFound;
            if (d === 0) return 1.00;
            let mult = 1;
            for (let i = 0; i < d; i++) { mult *= (n - i) / (n - m - i); }
            return Math.max(1, mult * 0.96); 
        };

        const createGridRows = (showAll = false) => {
            const rows = [];
            // Rows 1 to 4 (5 buttons each = 20 buttons)
            for (let i = 0; i < 4; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 5; j++) {
                    const index = i * 5 + j;
                    row.addComponents(new ButtonBuilder().setCustomId(`mine_${index}`).setLabel(revealed[index] || showAll ? (grid[index] === "mine" ? "💣" : "💎") : "❓").setStyle(revealed[index] || showAll ? (grid[index] === "mine" ? ButtonStyle.Danger : ButtonStyle.Success) : ButtonStyle.Secondary).setDisabled(revealed[index] || showAll || gameOver));
                }
                rows.addComponents(row);
            }
            // Row 5: 4 Grid buttons + 1 Cashout button (Total 5 components - limit fixed!)
            const lastRow = new ActionRowBuilder();
            for (let j = 0; j < 4; j++) {
                const index = 20 + j;
                lastRow.addComponents(new ButtonBuilder().setCustomId(`mine_${index}`).setLabel(revealed[index] || showAll ? (grid[index] === "mine" ? "💣" : "💎") : "❓").setStyle(revealed[index] || showAll ? (grid[index] === "mine" ? ButtonStyle.Danger : ButtonStyle.Success) : ButtonStyle.Secondary).setDisabled(revealed[index] || showAll || gameOver));
            }
            lastRow.addComponents(new ButtonBuilder().setCustomId("cashout").setLabel(`Cashout`).setStyle(ButtonStyle.Primary).setDisabled(diamondsFound === 0 || gameOver));
            rows.push(lastRow);
            return rows;
        };

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Mines`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`**Bet:** 🪙 ${bet} | **Mines:** 💣 ${minesCount}\n**Multiplier:** x${calculateMultiplier().toFixed(2)}`)
            .setColor("#2b2d31");

        const msg = await interaction.reply({ embeds: [embed], components: createGridRows() });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 300000 });

        collector.on("collect", async i => {
            if (i.customId.startsWith("mine_")) {
                const index = parseInt(i.customId.split("_")[1]);
                revealed[index] = true;
                if (grid[index] === "mine") {
                    gameOver = true;
                    collector.stop("hit_mine");
                    return i.update({ embeds: [new EmbedBuilder().setTitle("💥 BOOM!").setDescription(`You lost **🪙 ${bet}**`).setColor("#ff4b2b")], components: createGridRows(true) });
                } else {
                    diamondsFound++;
                    await i.update({ embeds: [embed.setDescription(`**Bet:** 🪙 ${bet} | **Mines:** 💣 ${minesCount}\n**Multiplier:** x${calculateMultiplier().toFixed(2)}`)], components: createGridRows() });
                }
            } else if (i.customId === "cashout") {
                collector.stop("cashout");
                await i.deferUpdate();
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "hit_mine") return;
            let finalMult = calculateMultiplier(), winAmount = Math.floor(bet * finalMult);
            let userProfile = await UserProfile.findOne({ userId });
            if (reason === "cashout") {
                userProfile.balance += winAmount; userProfile.wins += 1; userProfile.winAmount += (winAmount - bet); await userProfile.save();
                await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("💰 SUCCESS").setDescription(`You won **🪙 ${winAmount}** (x${finalMult.toFixed(2)})`).setColor("#2ecc71")], components: createGridRows(true) });
                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) winChannel.send(`🎉 **${interaction.user.username}** won **🪙 ${winAmount}** in Mines !!`);
            }
        });
    }
};