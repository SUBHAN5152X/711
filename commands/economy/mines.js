const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

const WIN_CHANNEL_ID = "1453275098038538374";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mines")
        .setDescription("Play Mines with a full 25-tile grid")
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

        // Internal Game Logic
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
            let m = 0.97 * (25 / (25 - bombCount));
            for(let i = 1; i < revealedCount; i++) {
                m *= (25 - i) / (25 - bombCount - i);
            }
            return m.toFixed(2);
        };

        // Function to create the 25-button grid (5 rows)
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

        // Initial Grid Message
        const gridEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Mines Grid`, iconURL: interaction.user.displayAvatarURL() })
            .setColor("#2b2d31")
            .setDescription(`**Bet:** 🪙 ${bet.toLocaleString()} | **Bombs:** 💣 ${bombCount}`);

        const gridMsg = await interaction.reply({ embeds: [gridEmbed], components: createGrid(), fetchReply: true });

        // Second Message: Cashout Controller
        const controllerEmbed = new EmbedBuilder()
            .setTitle("🎮 Game Controller")
            .setDescription(`Current Multiplier: **x1.00**\nPotential Profit: **🪙 0**`)
            .setColor("#f1c40f");

        const cashoutRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("cashout").setLabel("Cashout").setStyle(ButtonStyle.Success).setDisabled(true)
        );

        const controllerMsg = await interaction.channel.send({ 
            content: `${interaction.user}, use this to cash out:`, 
            embeds: [controllerEmbed], 
            components: [cashoutRow] 
        });

        // Collector for both messages
        const filter = i => i.user.id === userId;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });

        collector.on("collect", async i => {
            if (i.customId.startsWith("mine_")) {
                const index = parseInt(i.customId.split("_")[1]);
                if (revealed.includes(index) || gameOver) return i.deferUpdate();
                
                revealed.push(index);

                if (grid[index] === "bomb") {
                    gameOver = true;
                    collector.stop("lost");
                    await i.update({ embeds: [gridEmbed.setTitle("💥 BOOM!")], components: createGrid(true) });
                    return controllerMsg.edit({ content: "❌ You hit a bomb!", embeds: [], components: [] });
                } else {
                    multiplier = getMultiplier(revealed.length);
                    const currentProfit = Math.floor(bet * multiplier);
                    
                    await i.update({ components: createGrid() });
                    
                    // Update the SECOND message (Controller)
                    await controllerMsg.edit({
                        embeds: [controllerEmbed.setDescription(`Current Multiplier: **x${multiplier}**\nPotential Win: **🪙 ${currentProfit.toLocaleString()}**`)],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId("cashout").setLabel(`Cashout 🪙 ${currentProfit}`).setStyle(ButtonStyle.Success)
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
                await controllerMsg.edit({ 
                    content: `✅ **Profit Cashed Out!** You won **🪙 ${finalWin.toLocaleString()}**`, 
                    embeds: [], 
                    components: [] 
                });

                const winChannel = interaction.guild.channels.cache.get(WIN_CHANNEL_ID);
                if (winChannel) {
                    winChannel.send(`💣 **${interaction.user.username}** won **🪙 ${finalWin.toLocaleString()}** (x${multiplier}) in Mines!`);
                }
            }
        });
    }
};