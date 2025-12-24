require("dotenv/config");
const { Client, IntentsBitField, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const UserProfile = require("./schemas/UserProfile"); // Path check kar lena

const PREFIX = process.env.PREFIX || "-";

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.commands = new Collection();
const towerGames = new Map(); // Game state store karne ke liye

// Game Config (Rack.gg Style Multipliers)
const TOWER_CONFIG = {
    easy: { tiles: 3, bombs: 1, mult: 1.42 },
    med: { tiles: 2, bombs: 1, mult: 1.90 },
    hard: { tiles: 3, bombs: 2, mult: 2.82 },
    exp: { tiles: 4, bombs: 3, mult: 3.75 }
};

/* ================================
    INTERACTION HANDLER
================================ */
client.on("interactionCreate", async (interaction) => {
    
    // 1. Autocomplete
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete({ interaction, client });
        return;
    }

    // 2. Buttons Handler
    if (interaction.isButton()) {
        const customId = interaction.customId;

        // --- VERIFICATION SYSTEM ---
        if (customId === "verify_btn") {
            const roleId = "1453285948581216356";
            const sixtyDays = 60 * 24 * 60 * 60 * 1000;
            const accountAge = Date.now() - interaction.member.user.createdTimestamp;

            if (accountAge < sixtyDays) {
                return interaction.reply({ content: `❌ Account must be 60 days old.`, flags: [64] });
            }
            const role = interaction.guild.roles.cache.get(roleId);
            try {
                await interaction.member.roles.add(role);
                return interaction.reply({ content: "✅ Verified!", flags: [64] });
            } catch (err) {
                return interaction.reply({ content: "❌ Role Hierarchy Error!", flags: [64] });
            }
        }

        // --- TOWERS GAME ENGINE ---
        if (customId.startsWith("tw_") || customId.startsWith("tile_") || customId === "tw_cashout") {
            
            // A. Start Game (Difficulty Selection)
            if (customId.startsWith("tw_")) {
                const [, diff, bet] = customId.split("_");
                const amount = parseInt(bet);

                let profile = await UserProfile.findOne({ userId: interaction.user.id });
                if (profile.balance < amount) return interaction.reply({ content: "Balance low!", flags: [64] });

                profile.balance -= amount;
                await profile.save();

                towerGames.set(interaction.user.id, {
                    bet: amount,
                    diff: diff,
                    floor: 1,
                    multiplier: 1.0,
                    history: []
                });

                return renderTower(interaction, interaction.user.id);
            }

            // B. Tile Selection (Playing)
            const game = towerGames.get(interaction.user.id);
            if (!game) return interaction.reply({ content: "No active game!", flags: [64] });

            if (customId.startsWith("tile_")) {
                const config = TOWER_CONFIG[game.diff];
                const choice = parseInt(customId.split("_")[1]);
                const bombTile = Math.floor(Math.random() * config.tiles) + 1;

                if (choice === bombTile && config.bombs >= 1) { // Loss
                    towerGames.delete(interaction.user.id);
                    return interaction.update({
                        embeds: [new EmbedBuilder().setTitle("💥 BOOM!").setDescription(`You hit a bomb on Floor ${game.floor}!\nLost: **🪙 ${game.bet}**`).setColor("#ff4b2b")],
                        components: []
                    });
                } else { // Win Floor
                    game.multiplier *= config.mult;
                    game.floor += 1;
                    return renderTower(interaction, interaction.user.id);
                }
            }

            // C. Cashout
            if (customId === "tw_cashout") {
                const winnings = Math.floor(game.bet * game.multiplier);
                let profile = await UserProfile.findOne({ userId: interaction.user.id });
                profile.balance += winnings;
                await profile.save();

                towerGames.delete(interaction.user.id);
                return interaction.update({
                    embeds: [new EmbedBuilder().setTitle("💰 CASHOUT!").setDescription(`You climbed to floor ${game.floor - 1}!\nWon: **🪙 ${winnings.toLocaleString()}**`).setColor("#2ecc71")],
                    components: []
                });
            }
        }
    }
});

// Tower UI Renderer
async function renderTower(interaction, userId) {
    const game = towerGames.get(userId);
    const config = TOWER_CONFIG[game.diff];
    const winnings = Math.floor(game.bet * game.multiplier);

    const embed = new EmbedBuilder()
        .setAuthor({ name: "Tower Climb", iconURL: interaction.user.displayAvatarURL() })
        .setDescription(`### Floor: ${game.floor}\nMulti: **${game.multiplier.toFixed(2)}x**\nPending: **🪙 ${winnings.toLocaleString()}**`)
        .setColor("#2b2d31")
        .setFooter({ text: "Choose a tile to climb higher!" });

    const row = new ActionRowBuilder();
    for (let i = 1; i <= config.tiles; i++) {
        row.addComponents(new ButtonBuilder().setCustomId(`tile_${i}`).setLabel(`Tile ${i}`).setStyle(ButtonStyle.Secondary));
    }

    const ctrl = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("tw_cashout").setLabel(`Cashout (${winnings})`).setStyle(ButtonStyle.Success).setDisabled(game.floor === 1)
    );

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row, ctrl] });
    } else {
        await interaction.update({ embeds: [embed], components: [row, ctrl] });
    }
}

// Prefix & Express Server (Same as before)
// ... (Tera purana code yahan niche continue hoga)