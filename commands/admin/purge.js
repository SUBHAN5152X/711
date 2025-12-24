const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Bulk delete messages or clear the entire channel")
        .addStringOption(opt => 
            opt.setName("amount")
                .setDescription("Number (1-100) or type 'all' to nuke the channel")
                .setRequired(true)
        )
        // Command menu se hidden rahega unke liye jinke paas Manage Messages nahi hai
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    run: async ({ interaction }) => {
        const input = interaction.options.getString("amount");
        const channel = interaction.channel;

        try {
            // "ALL" Logic: Channel cloning (Best for total clear)
            if (input.toLowerCase() === "all") {
                const position = channel.position;
                const parent = channel.parentId;
                
                // User ko warn karne ke liye initial reply
                await interaction.reply({ content: "⏳ Nuking channel... please wait.", flags: [64] });

                const newChannel = await channel.clone();
                await channel.delete();
                
                await newChannel.setPosition(position);
                if (parent) await newChannel.setParent(parent);
                
                return await newChannel.send({ 
                    content: "🧹 **Channel Purged:** All messages have been cleared by " + interaction.user.tag
                }).then(m => setTimeout(() => m.delete().catch(() => {}), 10000));
            }

            const amount = parseInt(input);

            // Validations
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return interaction.reply({ 
                    content: "❌ **Invalid Input:** Enter a number between **1-100** or type **'all'**.", 
                    flags: [64] 
                });
            }

            // Bulk Delete
            const deleted = await channel.bulkDelete(amount, true);

            const successEmbed = new EmbedBuilder()
                .setColor("#27ae60")
                .setAuthor({ name: "Cleaning Successful", iconURL: interaction.guild.iconURL() })
                .setDescription(`✅ Purged **${deleted.size}** messages from this channel.`)
                .setFooter({ text: "This message will be deleted in 5s" });

            await interaction.reply({ embeds: [successEmbed] });

            // Auto-delete the success message to keep chat clean
            setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

        } catch (error) {
            console.error("PURGE_ERROR:", error);
            // Discord 14 din se purane messages bulk delete nahi karne deta
            return interaction.reply({ 
                content: "❌ **Error:** I cannot delete messages older than 14 days due to Discord's limitations.", 
                flags: [64] 
            });
        }
    },
};