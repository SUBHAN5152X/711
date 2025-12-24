const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ms = require("ms");
const Giveaway = require("../../schemas/Giveaway");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("711 Bet Giveaway System")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName("create")
                .setDescription("Start a giveaway")
                .addStringOption(opt => opt.setName("duration").setDescription("10m, 1h, 1d").setRequired(true))
                .addIntegerOption(opt => opt.setName("winners").setDescription("Number of winners").setRequired(true))
                .addStringOption(opt => opt.setName("prize").setDescription("What is the prize?").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("end")
                .setDescription("End a giveaway early")
                .addStringOption(opt => opt.setName("message_id").setDescription("Giveaway Message ID").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("reroll")
                .setDescription("Pick a new winner")
                .addStringOption(opt => opt.setName("message_id").setDescription("Giveaway Message ID").setRequired(true))
        ),

    run: async ({ interaction, client }) => {
        const sub = interaction.options.getSubcommand();

        // --- CREATE ---
        if (sub === "create") {
            const duration = interaction.options.getString("duration");
            const winners = interaction.options.getInteger("winners");
            const prize = interaction.options.getString("prize");
            const durationMs = ms(duration);

            if (!durationMs) return interaction.reply({ content: "❌ Invalid duration!", flags: [64] });

            const endTime = new Date(Date.now() + durationMs);
            const endTs = Math.floor(endTime.getTime() / 1000);

            const embed = new EmbedBuilder()
                .setTitle(`🎉 GIVEAWAY: ${prize}`)
                .setDescription(`Click the button to enter!\n\n⏳ **Ends:** <t:${endTs}:R>\n🏆 **Winners:** ${winners}\n👤 **Host:** ${interaction.user}`)
                .setColor("#f1c40f")
                .setFooter({ text: "Join now!" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("ga_join").setEmoji("🎉").setStyle(ButtonStyle.Primary).setLabel("Enter")
            );

            const msg = await interaction.reply({ content: "✅ Giveaway Created!", fetchReply: true });
            const gaMsg = await interaction.channel.send({ embeds: [embed], components: [row] });

            await Giveaway.create({
                messageId: gaMsg.id,
                channelId: interaction.channelId,
                guildId: interaction.guildId,
                prize,
                winnerCount: winners,
                endTime,
                hostedBy: interaction.user.id,
                participants: []
            });
        }

        // --- END ---
        if (sub === "end") {
            const msgId = interaction.options.getString("message_id");
            const data = await Giveaway.findOne({ messageId: msgId });

            if (!data || data.ended) return interaction.reply({ content: "❌ Giveaway not found or already ended!", flags: [64] });

            await endGiveaway(client, data);
            return interaction.reply({ content: "✅ Giveaway ended early!", flags: [64] });
        }

        // --- REROLL ---
        if (sub === "reroll") {
            const msgId = interaction.options.getString("message_id");
            const data = await Giveaway.findOne({ messageId: msgId });

            if (!data || !data.ended) return interaction.reply({ content: "❌ Giveaway hasn't ended yet!", flags: [64] });
            if (data.participants.length === 0) return interaction.reply({ content: "❌ No participants to reroll!", flags: [64] });

            const newWinner = data.participants[Math.floor(Math.random() * data.participants.length)];
            await interaction.reply({ content: `🎊 **New Winner:** <@${newWinner}>\nPrize: **${data.prize}**` });
        }
    }
};

// --- HELPER FUNCTION TO END GIVEAWAY ---
async function endGiveaway(client, data) {
    const channel = await client.channels.fetch(data.channelId);
    const msg = await channel.messages.fetch(data.messageId);
    
    if (data.participants.length === 0) {
        data.ended = true;
        await data.save();
        return msg.edit({ content: "❌ No one joined the giveaway.", embeds: [], components: [] });
    }

    const winners = [];
    const tempParts = [...data.participants];
    for (let i = 0; i < Math.min(data.winnerCount, tempParts.length); i++) {
        const win = tempParts.splice(Math.floor(Math.random() * tempParts.length), 1)[0];
        winners.push(`<@${win}>`);
    }

    const endEmbed = new EmbedBuilder()
        .setTitle("🎁 Giveaway Ended")
        .setDescription(`**Prize:** ${data.prize}\n**Winners:** ${winners.join(", ")}\n**Host:** <@${data.hostedBy}>`)
        .setColor("#2b2d31")
        .setTimestamp();

    await msg.edit({ embeds: [endEmbed], components: [] });
    await channel.send(`🎊 Congratulations ${winners.join(", ")}! You won **${data.prize}**!`);
    
    data.ended = true;
    await data.save();
}