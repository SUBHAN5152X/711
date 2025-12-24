const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

// Admin IDs for double security check
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-verify")
        .setDescription("Setup the 711 Bet verification system (Admin Only)")
        // Isse normal users ko command menu mein ye command nahi dikhegi
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async ({ interaction }) => {
        // Double Check: Only specified Admin IDs can run this
        if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ 
                content: "❌ **Critical Error:** You are not authorized to deploy security protocols.", 
                flags: [64] 
            });
        }

        const verifyEmbed = new EmbedBuilder()
            .setAuthor({ name: "711 Bet | Global Security", iconURL: interaction.guild.iconURL() })
            .setTitle("🛡️ Verification Required")
            .setDescription(
                "Welcome to **711 Bet**. To maintain a fair and secure gaming environment, all members must undergo a quick verification process.\n\n" +
                "**Verification Criteria:**\n" +
                "• Your account must be older than **60 Days (2 Months)**.\n" +
                "• No VPN or Proxy connection should be active.\n\n" +
                "**Instructions:**\n" +
                "Click the button below. Our system will scan your account metadata and grant access if you meet the requirements."
            )
            .addFields(
                { name: "Current Status", value: "🔴 Unverified", inline: true },
                { name: "Processing Time", value: "⚡ Instant", inline: true }
            )
            .setColor("#2b2d31") // Dark Premium Theme
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: "Security System v2.0 • 711 Bet", iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("verify_btn") // index.js ke listener se linked hai
                .setLabel("Start Verification")
                .setStyle(ButtonStyle.Success)
                .setEmoji("✅")
        );

        // Sirf admin ko confirmation reply dikhega
        await interaction.reply({ content: "✅ Security gate has been deployed.", flags: [64] });
        
        // Channel mein main embed message jayega
        return await interaction.channel.send({ embeds: [verifyEmbed], components: [row] });
    },
};