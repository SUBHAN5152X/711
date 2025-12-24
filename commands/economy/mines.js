const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_CHANNEL_ID = "1453275098038538374";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mines")
        .setDescription("Play Mines with custom multipliers")
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
        if (!profile || profile.balance < bet) return interaction.reply({ content: "❌ Insufficient balance!", ephemeral: true });

        profile.balance -= bet;
        profile.wageredAmount = (profile.wageredAmount || 0) + bet;
        await profile.save();

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
        let multiplier = 0;
        let gameOver = false;

        // --- CUSTOM MULTIPLIER LOGIC ---
        const getMultiplier = (revealedCount) => {
            // Base sequence for 3 mines
            const baseSequence = [0.8, 1.0, 1.04, 1.1, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.5, 7.5, 10.0, 15.0, 25.0, 50.0, 100.0];
            
            // Shift the starting point based on bomb count
            // 3 bombs starts at index 0, 4 bombs starts at index 1, etc.
            let shift = bombCount - 3;
            let targetIndex = (revealedCount - 1) + shift;

            // If we go out of bounds of our manual sequence, we calculate a generic growth
            if (targetIndex >= baseSequence.length) {
                let lastVal = baseSequence[baseSequence.length - 1];
                return (lastVal * Math.pow(1.5, targetIndex - baseSequence.length + 1)).toFixed(2);
            }
            
            return baseSequence[targetIndex].toFixed(2);
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
            return rows;
        };

        const gridEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Mines Grid`, iconURL: interaction.user.displayAvatarURL() })
            .setColor("#2b2d31")
            .setDescription(`**Bet:** 🪙 ${bet.toLocaleString()} | **Bombs:** 💣 ${bombCount}`);

        const gridMsg = await interaction.reply({ embeds: [gridEmbed], components: createGrid(), fetchReply: true });

        const controllerEmbed = new EmbedBuilder()
            .setTitle("🎮 Game Controller")
            .setDescription(`Select a tile to start!`)
            .setColor("#f1c40f");

        const cashoutRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("cashout").setLabel("Cashout").setStyle(ButtonStyle.Success).setDisabled(true)
        );

        const controllerMsg = await interaction.channel.send({ 
            content: `${interaction.user}, controls:`, 
            embeds: [controllerEmbed], 
            components: [cashoutRow] 
        });

        const collector = interaction.channel.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 300000 });

        collector.on("collect", async i => {
            if (i.customId.startsWith("mine_")) {
                const index = parseInt(i.customId.split("_")[1]);
                if (revealed.includes(index) || gameOver) return i.deferUpdate();
                
                revealed.push(index);

                if (grid[index] === "bomb") {
                    gameOver = true;
                    collector.stop("lost");
                    await i.update({ embeds: [gridEmbed.setTitle("💥 BOOM!")], components: createGrid(true) });
                    return controllerMsg.edit({ content: "❌ Better luck next time!", embeds: [], components: [] });
                } else {
                    multiplier = getMultiplier(revealed.length);
                    const currentWin = Math.floor(bet * multiplier);
                    
                    await i.update({ components: createGrid() });
                    
                    await controllerMsg.edit({
                        embeds: [controllerEmbed.setDescription(`Current Multiplier: **x${multiplier}**\nNext Value: **🪙 ${currentWin.toLocaleString()}**`)],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId("cashout").setLabel(`Cashout 🪙 ${currentWin}`).setStyle(ButtonStyle.Success)
                        )]
                    });
                }
            } else if (i.customId === "cashout") {
                gameOver = true;
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

                await gridMsg.edit({ embeds: [gridEmbed.setTitle("🎉 SAFE").setColor("#2ecc71")], components: createGrid(true) });
                await controllerMsg.edit({ content: `✅ **Success!** You cashed out **🪙 ${finalWin.toLocaleString()}**`, embeds: [], components: [] });

                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) {
                    winChannel.send(`💣 **${interaction.user.username}** won **🪙 ${finalWin.toLocaleString()}** (x${multiplier}) in Mines!`);
                }
            }
        });
    }
};