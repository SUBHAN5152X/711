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
        )
        // Command menu se bando ke liye hide karne ke liye
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    run: async ({ interaction }) => {
        // 1. Admin Security Check (Backup)
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ 
                content: "❌ You do not have permission to use this admin tool.", 
                flags: [64] 
            });
        }

        const targetMember = interaction.options.getMember("target");
        const reason = interaction.options.getString("reason") || "Begging/Annoying in chat";
        const duration = 10 * 60 * 1000; // 10 Minutes

        try {
            // 2. Validations
            if (!targetMember) {
                return interaction.reply({ content: "❌ Target user not found in this server.", flags: [64] });
            }
            
            if (!targetMember.moderatable) {
                return interaction.reply({ 
                    content: "❌ I cannot timeout this user. Their role might be higher than mine.", 
                    flags: [64] 
                });
            }

            // 3. Apply Timeout
            await targetMember.timeout(duration, reason);

            // 4. Premium Punishment Embed
            const begEmbed = new EmbedBuilder()
                .setAuthor({ name: `User Silence Applied`, iconURL: interaction.guild.iconURL() })
                .setColor('#e74c3c') // Intense Red
                .setDescription(`🚫 <@${targetMember.id}> has been placed in a **10-minute timeout**.`)
                .addFields(
                    { name: '👤 Target', value: `${targetMember.user.tag}`, inline: true },
                    { name: '🛡️ Staff', value: `${interaction.user.username}`, inline: true },
                    { name: '📝 Reason', value: `\`${reason}\``, inline: false }
                )
                .setFooter({ text: '711 Bet Security', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [begEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Failed to apply timeout. Check my permissions.", flags: [64] });
        }
    },
};