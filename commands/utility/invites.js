const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Check invite statistics")
        .addSubcommand(sub => 
            sub.setName("show")
                .setDescription("Apne ya kisi aur ke total invites dekhein")
                .addUserOption(opt => opt.setName("user").setDescription("User select karein")))
        .addSubcommand(sub => 
            sub.setName("inviter")
                .setDescription("Dekhein aapko kisne invite kiya tha"))
        .addSubcommand(sub => 
            sub.setName("top")
                .setDescription("Server ke top inviters ki list")),

    run: async ({ interaction }) => {
        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser("user") || interaction.user;

        // --- INVITE SHOW ---
        if (sub === "show") {
            const data = await UserProfile.findOne({ userId: target.id });
            const count = data?.invites || 0;

            const embed = new EmbedBuilder()
                .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
                .setTitle("📩 Invite Statistics")
                .setDescription(`${target.id === interaction.user.id ? "Aapne" : `**${target.username}** ne`} kul **${count}** bando ko invite kiya hai.`)
                .setColor("#5865F2")
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: "711 Bet • Community Growth" });

            return interaction.reply({ embeds: [embed] });
        }

        // --- INVITER ---
        if (sub === "inviter") {
            const data = await UserProfile.findOne({ userId: interaction.user.id });
            const inviter = data?.inviterId ? `<@${data.inviterId}>` : "Koi nahi (Direct Join)";

            const embed = new EmbedBuilder()
                .setTitle("🔗 Inviter Info")
                .setDescription(`Aapko is server mein **${inviter}** ne bulaya tha.`)
                .setColor("#2ecc71")
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // --- TOP INVITERS (Leaderboard) ---
        if (sub === "top") {
            const topInviters = await UserProfile.find().sort({ invites: -1 }).limit(10);
            
            let description = topInviters.length 
                ? topInviters.map((user, index) => `**${index + 1}.** <@${user.userId}> — \`${user.invites || 0}\` invites`).join("\n")
                : "Abhi tak kisi ne invite nahi kiya.";

            const embed = new EmbedBuilder()
                .setTitle("🏆 Top Inviters Leaderboard")
                .setDescription(description)
                .setColor("#f1c40f")
                .setFooter({ text: "Join our growth!" });

            return interaction.reply({ embeds: [embed] });
        }
    }
};