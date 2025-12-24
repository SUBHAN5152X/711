const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Start a premium giveaway with a countdown")
        .addStringOption(opt => opt.setName("duration").setDescription("Duration (e.g. 10m, 1h, 1d)").setRequired(true))
        .addIntegerOption(opt => opt.setName("winners").setDescription("Number of winners").setRequired(true))
        .addStringOption(opt => opt.setName("prize").setDescription("What is the prize?").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        const durationInput = interaction.options.getString("duration");
        const winnerCount = interaction.options.getInteger("winners");
        const prize = interaction.options.getString("prize");

        const durationMs = ms(durationInput);
        if (!durationMs) {
            return interaction.reply({ content: "❌ Invalid time format! Use `10m`, `1h`, etc.", flags: [64] });
        }

        const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);

        // Animated Emojis (Ye standard Discord emojis hain jo animated dikhte hain)
        const giftEmoji = "<a:Giveaway:123456789012345678>"; // Agar aapka apna emoji hai toh ID badal dena, warna standard 🎁 use karo

        const giveawayEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.guild.name} | GIVEAWAY`, iconURL: interaction.guild.iconURL() })
            .setTitle(`${prize}`)
            .setDescription(
                `Click the 🎉 button below to participate!\n\n` +
                `⏳ **Ends At:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n` +
                `👤 **Hosted By:** ${interaction.user}\n` +
                `🏆 **Winners:** ${winnerCount}`
            )
            .setColor("#f1c40f") // Premium Gold Color
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: `${interaction.guild.name} • Good Luck!`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("giveaway_join")
                .setLabel("Join Giveaway")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("🎉")
        );

        await interaction.reply({ content: "✅ Giveaway started successfully!", flags: [64] });
        const giveawayMsg = await interaction.channel.send({ embeds: [giveawayEmbed], components: [row] });

        // Giveaway Manager Logic (Basic)
        // Note: Full advanced giveaway system ke liye MongoDB mein data save karna padta hai
        // Ye basic logic hai jo duration khatam hone par winners pick karega
        
        const filter = i => i.customId === 'giveaway_join';
        const collector = giveawayMsg.createMessageComponentCollector({ filter, time: durationMs });

        let participants = new Set();

        collector.on('collect', async i => {
            if (participants.has(i.user.id)) {
                return i.reply({ content: "❌ You have already joined this giveaway!", flags: [64] });
            }
            participants.add(i.user.id);
            await i.reply({ content: "✅ You've successfully joined the giveaway!", flags: [64] });
        });

        collector.on('end', async () => {
            const participantArray = Array.from(participants);
            
            if (participantArray.length === 0) {
                return giveawayMsg.edit({ 
                    content: "❌ **Giveaway Ended:** No one participated.", 
                    embeds: [giveawayEmbed.setColor("#36393f")], 
                    components: [] 
                });
            }

            const winners = [];
            for (let i = 0; i < Math.min(winnerCount, participantArray.length); i++) {
                const randomIndex = Math.floor(Math.random() * participantArray.length);
                winners.push(participantArray.splice(randomIndex, 1)[0]);
            }

            const winnerMentions = winners.map(id => `<@${id}>`).join(", ");
            
            const endEmbed = EmbedBuilder.from(giveawayEmbed)
                .setDescription(`**Giveaway Ended!**\n\n🏆 **Winners:** ${winnerMentions}\n👤 **Hosted By:** ${interaction.user}`)
                .setColor("#2f3136");

            await giveawayMsg.edit({ embeds: [endEmbed], components: [] });
            await interaction.channel.send(`🎊 Congratulations ${winnerMentions}! You won the **${prize}**!`);
        });
    },
};