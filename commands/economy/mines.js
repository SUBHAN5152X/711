const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

// Winner Log Channel
const WIN_CHANNEL_ID = "1453275098038538374";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mines")
        .setDescription("Play Mines and win big!")
        .addIntegerOption(opt => opt.setName("bet").setDescription("Amount to bet").setRequired(true))
        .addIntegerOption(opt => 
            opt.setName("bombs")
            .setDescription("Number of bombs (3-24)")
            .setMinValue(3) 
            .setMaxValue(24) 
            .setRequired(true)
        ),

    run: async ({ interaction }) => {
        const bet = interaction.options.getInteger("bet");
        const bombCount = interaction.options.getInteger("bombs");
        const userId = interaction.user.id;

        let profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < bet) return interaction.reply({ content: "❌ You have insufficient balance!", ephemeral: true });

        // Initial Balance Deduction
        profile.balance -= bet;
        profile.wageredAmount = (profile.wageredAmount || 0) + bet;
        await profile.save();

        // Game Grid Generation
        let grid = Array(25).fill("diamond");
        let bombs = [];
        while (bombs.length < bombCount) {
            let rand = Math.floor(Math.random() * 25);
            if (!bombs.includes(rand)) {
                bombs.push(rand);
                grid[rand] = "bomb";
            }
        }

        let revealed = [];
        let multiplier = 1;
        let gameOver = false;

        const getMultiplier = (revealedCount) => {
            // Standard Casino Multiplier Formula
            let m = 0.97 * (25 / (25 - bombCount));
            for(let i = 1; i < revealedCount; i++) {
                m *= (25 - i) / (25 - bombCount - i);
            }
            return m.toFixed(2);
        };

        const createGrid = (showAll = false) => {
            const rows = [];
            for (let i = 0; i < 5; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 5; j++) {
                    const index = i * 5 + j;
                    const btn = new ButtonBuilder().setCustomId(`mine_${index}`);
                    
                    if (revealed.includes(index)) {
                        btn.setEmoji(grid[index] === "bomb" ? "💣" : "💎").setStyle(grid[index] === "bomb" ? ButtonStyle.Danger : ButtonStyle.Success).setDisabled(true);
                    } else if (showAll) {
                        btn.setEmoji(grid[index] === "bomb" ? "💣" : "💎").setStyle(ButtonStyle.Secondary).setDisabled(true);
                    } else {
                        btn.setEmoji("❓").setStyle(ButtonStyle.Primary);
                    }
                    row.addComponents(btn);
                }
                rows.push(row);
            }
            
            const cashoutRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("cashout")
                    .setLabel(`Cashout (x${getMultiplier(revealed.length)})`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(revealed.length === 0 || gameOver)
            );
            rows.push(cashoutRow);
            return rows;
        };

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Mines Game`, iconURL: interaction.user.displayAvatarURL() })
            .setColor("#2b2d31")
            .setDescription(`**Bet:** 🪙 ${bet.toLocaleString()}\n**Bombs:** 💣 ${bombCount}\n**Multiplier:** x1.00`)
            .setFooter({ text: "Find diamonds to increase your multiplier!" });

        const msg = await interaction.reply({ embeds: [embed], components: createGrid() });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 300000 });

        collector.on("collect", async i => {
            if (i.customId.startsWith("mine_")) {
                const index = parseInt(i.customId.split("_")[1]);
                if (revealed.includes(index)) return i.deferUpdate();
                
                revealed.push(index);

                if (grid[index] === "bomb") {
                    gameOver = true;
                    collector.stop("lost");
                    return i.update({ 
                        embeds: [embed.setTitle("💥 GAME OVER").setColor("#ff4b2b").setDescription(`**Lost:** 🪙 ${bet.toLocaleString()}\n**Bombs:** 💣 ${bombCount}`)], 
                        components: createGrid(true) 
                    });
                } else {
                    multiplier = getMultiplier(revealed.length);
                    if (revealed.length === (25 - bombCount)) return collector.stop("win");
                    await i.update({ 
                        embeds: [embed.setDescription(`**Bet:** 🪙 ${bet.toLocaleString()}\n**Bombs:** 💣 ${bombCount}\n**Current Multiplier:** x${multiplier}`)], 
                        components: createGrid() 
                    });
                }
            } else if (i.customId === "cashout") {
                collector.stop("cashout");
                await i.deferUpdate();
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "cashout" || reason === "win") {
                const finalWin = Math.floor(bet * multiplier);
                const user = await UserProfile.findOne({ userId });
                user.balance += finalWin;
                await user.save();

                await interaction.editReply({ 
                    embeds: [embed.setTitle("🎉 SUCCESSFUL CASHOUT").setDescription(`**Won:** 🪙 ${finalWin.toLocaleString()}\n**Multiplier:** x${multiplier}`).setColor("#2ecc71")], 
                    components: createGrid(true) 
                });

                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) {
                    winChannel.send(`💣 **${interaction.user.username}** just cashed out **🪙 ${finalWin.toLocaleString()}** (x${multiplier}) with **${bombCount} bombs**!`);
                }
            }
        });
    }
};