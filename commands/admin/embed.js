const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Bot ke through ek custom embed bhejien")
        .addStringOption(opt => opt.setName("title").setDescription("Embed ka title").setRequired(true))
        .addStringOption(opt => opt.setName("description").setDescription("Embed ka content (Emoji use kar sakte ho)").setRequired(true))
        .addStringOption(opt => opt.setName("color").setDescription("Hex code (e.g. #ff0000) ya color name").setRequired(false))
        .addStringOption(opt => opt.setName("footer").setDescription("Niche ka chota text").setRequired(false))
        .addStringOption(opt => opt.setName("image").setDescription("Badi image ka link (URL)").setRequired(false))
        .setThumbnail(null)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    run: async ({ interaction }) => {
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const color = interaction.options.getString("color") || "#2b2d31";
        const footer = interaction.options.getString("footer");
        const image = interaction.options.getString("image");

        // Description mein emoji support check: Discord automatically handles <a:name:id> strings
        // Bas aapko description mein emoji paste karna hai.

        const customEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description.replace(/\\n/g, '\n')) // \n support for new lines
            .setColor(color.startsWith("#") ? color : "#2b2d31")
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        if (footer) customEmbed.setFooter({ text: footer, iconURL: interaction.guild.iconURL() });
        if (image) {
            if (image.startsWith("http")) customEmbed.setImage(image);
            else return interaction.reply({ content: "❌ Invalid Image URL!", flags: [64] });
        }

        try {
            await interaction.channel.send({ embeds: [customEmbed] });
            await interaction.reply({ content: "✅ Embed sent successfully!", flags: [64] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Kuch galti hui! Check description or color code.", flags: [64] });
        }
    },
};