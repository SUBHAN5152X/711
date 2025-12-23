const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile"); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw your points')
        .addIntegerOption(o => o.setName('amount').setDescription('Points to withdraw').setRequired(true)),

    run: async ({ interaction, message, args }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        const amount = interaction ? interaction.options.getInteger('amount') : parseInt(args[0]);

        try {
            const profile = await UserProfile.findOne({ userId: user.id });
            if (!profile || profile.balance < amount) return (interaction || message).reply("❌ Insufficient balance!");

            // --- Stats Update: Withdrawals tracking ---
            profile.balance -= amount;
            profile.withdrawals += amount; // Total points withdrawn
            profile.withdrawCount += 1;   // How many times
            await profile.save();

            const withdrawEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Withdrawal Successful`, iconURL: user.displayAvatarURL() })
                .setDescription(`✅ Successfully withdrawn **🪙 ${amount} points**.`)
                .setColor('#ff4b2b')
                .setFooter({ text: '711 Bet', iconURL: (interaction || message).client.user.displayAvatarURL() });

            return interaction ? await interaction.editReply({ embeds: [withdrawEmbed] }) : await message.channel.send({ embeds: [withdrawEmbed] });
        } catch (e) { console.error(e); }
    },
};