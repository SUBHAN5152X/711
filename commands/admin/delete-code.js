const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Code = require("../../schemas/Code");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-code")
        .setDescription("Delete an existing promo code")
        .addStringOption(opt => 
            opt.setName("code")
                .setDescription("Select the code to delete")
                .setRequired(true)
                .setAutocomplete(true) // Isse list show hogi
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Ye function codes ki list fetch karke Discord ko bhejega
    autocomplete: async ({ interaction }) => {
        const focusedValue = interaction.options.getFocused().toUpperCase();
        
        try {
            // Database se saare codes uthao
            const allCodes = await Code.find().limit(25); 
            
            // Filter karo jo user type kar raha hai uske basis pe
            const filtered = allCodes.filter(c => c.code.startsWith(focusedValue));
            
            // Discord ko list bhejo (Max 25 allowed)
            await interaction.respond(
                filtered.map(c => ({ name: `${c.code} ($${c.amount})`, value: c.code }))
            );
        } catch (error) {
            console.error("Autocomplete Error:", error);
        }
    },

    run: async ({ interaction }) => {
        const codeStr = interaction.options.getString("code").toUpperCase();

        try {
            const deleted = await Code.findOneAndDelete({ code: codeStr });

            if (!deleted) {
                return interaction.reply({ content: `❌ Code \`${codeStr}\` nahi mila!`, flags: [64] });
            }

            const delEmbed = new EmbedBuilder()
                .setTitle("🗑️ Code Deleted")
                .setDescription(`Promo code **${codeStr}** ko database se permanent hata diya gaya hai.`)
                .setColor("#ff3e3e")
                .setTimestamp();

            return await interaction.reply({ embeds: [delEmbed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "❌ Delete karte waqt error aaya.", flags: [64] });
        }
    },
};