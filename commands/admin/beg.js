const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("beg")
        .setDescription("Quick 10-minute timeout for a user (Admin Only)")
        .addUserOption(option => 
            option.setName("target")
                .setDescription("The user to timeout for 10 minutes")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the timeout")
                .setRequired(false)
        ),

    run: async ({ interaction }) => {
        // 1. Admin Security Check
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ content: "❌ You do not have permission to use this admin command.", ephemeral: true });
        }

        const targetMember = interaction.options.getMember("target");
        const reason = interaction.options.getString("reason") || "Begging/Annoying in chat";
        const duration = 10 * 60 * 1000; // 10 Minutes

        try {
            // 2. Validations
            if (!targetMember) return interaction.reply({ content: "❌ User server mein nahi mila.", ephemeral: true });
            
            if (!targetMember.moderatable) {
                return interaction.reply({ content: "❌ Main is user ko timeout nahi de sakta (Role hierarchy issue).", ephemeral: true });
            }

            // 3. Apply Timeout
            await targetMember.timeout(duration, reason);

            // 4. Premium Success Embed
            const begEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: User Timed Out`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`✅ <@${targetMember.id}> has been timed out for **10 minutes**.`)
                .addFields(
                    { name: '👤 Target', value: `<@${targetMember.id}>`, inline: true },
                    { name: '🛡️ Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📝 Reason', value: `\`${reason}\``, inline: false }
                )
                .setColor('#ff4b2b') // Red for Punishment
                .setFooter({ text: '711 Bet', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [begEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Error applying timeout.", ephemeral: true });
        }
    },
};