const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Code = require("../../schemas/Code");

// Admin security backup
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-code")
        .setDescription("Remove a promo code from the system (Admin Only)")
        .addStringOption(opt => 
            opt.setName("code")
                .setDescription("Search and select the code to delete")
                .setRequired(true)
                .setAutocomplete(true) 
        )
        // Hidden from non-admins
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Real-time search in Discord menu
    autocomplete: async ({ interaction }) => {
        const focusedValue = interaction.options.getFocused().toUpperCase();
        
        try {
            // Sirf wahi codes fetch karo jo type kiye gaye words se match ho rahe ho
            const allCodes = await Code.find({ code: { $regex: focusedValue, $options: 'i' } }).limit(25); 
            
            // Discord menu mein list bhejo
            await interaction.respond(
                allCodes.map(c => ({ 
                    name: `🎫 ${c.code} (Reward: 🪙 ${c.amount.toLocaleString()})`, 
                    value: c.code 
                }))
            );
        } catch (error) {
            console.error("Autocomplete Search Error:", error);
        }
    },

    run: async ({ interaction }) => {
        // Double Safety Check
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ 
                content: "❌ **Access Denied:** You are not authorized to delete system records.", 
                flags: [64] 
            });
        }

        const codeStr = interaction.options.getString("code").toUpperCase();

        try {
            const deleted = await Code.findOneAndDelete({ code: codeStr });

            if (!deleted) {
                return interaction.reply({ 
                    content: `❌ **Not Found:** Promo code \`${codeStr}\` does not exist in our database.`, 
                    flags: [64] 
                });
            }

            const delEmbed = new EmbedBuilder()
                .setAuthor({ name: "System Update: Code Removed", iconURL: interaction.guild.iconURL() })
                .setDescription(`The promo code **${codeStr}** has been permanently deleted from the database.`)
                .addFields(
                    { name: "Deleted By", value: `${interaction.user.username}`, inline: true },
                    { name: "Status", value: "🗑️ Purged Successfully", inline: true }
                )
                .setColor("#e74c3c") // Critical Red
                .setFooter({ text: "711 Bet • Data Management" })
                .setTimestamp();

            return await interaction.reply({ embeds: [delEmbed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "❌ **Fatal Error:** Could not complete the deletion process.", flags: [64] });
        }
    },
};