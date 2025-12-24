const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Delete a specific number of messages or all messages")
        .addStringOption(opt => 
            opt.setName("amount")
                .setDescription("Number of messages (1-100) or type 'all'")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Sirf moderators ke liye

    run: async ({ interaction }) => {
        const input = interaction.options.getString("amount");
        const channel = interaction.channel;

        try {
            if (input.toLowerCase() === "all") {
                // "all" logic: Channel ko clone karke purana delete kar do (Best way to purge all)
                const position = channel.position;
                const newChannel = await channel.clone();
                await channel.delete();
                await newChannel.setPosition(position);
                
                return await newChannel.send({ 
                    content: "🧹 **Channel has been completely cleared!**", 
                    flags: [64] 
                });
            }

            const amount = parseInt(input);

            if (isNaN(amount) || amount < 1 || amount > 100) {
                return interaction.reply({ 
                    content: "❌ Please enter a valid number between **1 and 100**, or type **'all'**.", 
                    flags: [64] 
                });
            }

            // Messages delete karo
            const deleted = await channel.bulkDelete(amount, true);

            const successEmbed = new EmbedBuilder()
                .setColor("#2ecc71")
                .setDescription(`✅ Successfully deleted **${deleted.size}** messages.`)
                .setFooter({ text: "711 Bet Admin Tools" });

            await interaction.reply({ embeds: [successEmbed] });

            // 5 second baad success message delete kar do taaki chat saaf rahe
            setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

        } catch (error) {
            console.error("PURGE_ERROR:", error);
            return interaction.reply({ 
                content: "❌ I can only delete messages that are under 14 days old.", 
                flags: [64] 
            });
        }
    },
};