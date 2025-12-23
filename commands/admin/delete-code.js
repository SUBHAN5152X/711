const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Code = require("../../schemas/Code");
// Admin IDs aapke .env file se aayengi
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-code")
        .setDescription("Delete a redeemable code (Admin only)")
        .addStringOption(option =>
            option.setName("code")
                .setDescription("The code you want to delete")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
        // Admin Check
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
        }

        const codeStr = interaction.options.getString("code").toUpperCase();

        try {
            // Database mein code dhoondhein aur delete karein
            const deletedCode = await Code.findOneAndDelete({ code: codeStr });

            if (!deletedCode) {
                const errorEmbed = new EmbedBuilder()
                    .setAuthor({ name: `crushmmerror: Code Not Found`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`❌ Code **${codeStr}** database mein nahi mila.`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() });

                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Success Embed
            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Code Deleted Successfully`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`✅ Code **${codeStr}** ko database se remove kar diya gaya hai.`)
                .addFields(
                    { name: '💰 Was Worth', value: `${deletedCode.amount} points`, inline: true },
                    { name: '👤 Created By', value: `<@${deletedCode.createdBy}>`, inline: true }
                )
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "Error deleting code.", ephemeral: true });
        }
    },
};