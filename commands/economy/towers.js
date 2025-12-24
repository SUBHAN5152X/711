const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("towers")
        .setDescription("Start a Tower Climb game")
        .addIntegerOption(opt => 
            opt.setName("bet")
                .setDescription("Amount to bet")
                .setRequired(true)
        ),

    run: async ({ interaction }) => {
        const bet = interaction.options.getInteger("bet");
        const userId = interaction.user.id;

        let profile = await UserProfile.findOne({ userId });
        if (!profile || profile.balance < bet) {
            return interaction.reply({ content: "❌ Balance kam hai!", flags: [64] });
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Tower Climb", iconURL: interaction.user.displayAvatarURL() })
            .setTitle(`Bet: 🪙 ${bet.toLocaleString()}`)
            .setDescription(
                "### Choose your difficulty?\n" +
                "The higher your difficulty, the higher the multiplier per floor!\n\n" +
                "Choose a difficulty to start the game."
            )
            .setColor("#2b2d31")
            .setThumbnail(interaction.guild.iconURL()) // Server Logo
            .setFooter({ text: "711 Bet • Good Luck!" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`tw_easy_${bet}`).setLabel("Easy").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`tw_med_${bet}`).setLabel("Medium").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`tw_hard_${bet}`).setLabel("Hard").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`tw_exp_${bet}`).setLabel("Extreme").setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};