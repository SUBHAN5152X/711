const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Bot ke through ek custom embed bhejien")
        .addStringOption(opt => opt.setName("title").setDescription("Embed ka title").setRequired(true))
        .addStringOption(opt => opt.setName("description").setDescription("Embed ka content (Emoji use kar sakte ho)").setRequired(true))
        .addStringOption(opt => opt.setName("color").setDescription("Hex code (e.g. #ff0000)").setRequired(false))
        .addStringOption(opt => opt.setName("footer").setDescription("Niche ka chota text").setRequired(false))
        .addStringOption(opt => opt.setName("image").setDescription("Badi image ka link (URL)").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    run: async ({ interaction }) => {
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const color = interaction.options.getString("color") || "#2b2d31";
        const footer = interaction.options.getString("footer");
        const image = interaction.options.getString("image");

        const customEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description.replace(/\\n/g, '\n')) 
            .setColor(color.startsWith("#") ? color : "#2b2d31")
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        if (footer) customEmbed.setFooter({ text: footer, iconURL: interaction.guild.iconURL() });
        
        if (image) {
            if (image.startsWith("http")) {
                customEmbed.setImage(image);
            }
        }

        try {
            // Channel mein embed bhejna
            await interaction.channel.send({ embeds: [customEmbed] });
            // Admin ko response dena
            await interaction.reply({ content: "✅ Embed successfully sent!", flags: [64] });
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: "❌ Error sending embed. Check image link or description.", flags: [64] });
            }
        }
    },
};