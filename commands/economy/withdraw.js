const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile"); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw your points (Min $2.00)')
        .addIntegerOption(o => o.setName('amount').setDescription('Points to withdraw (Min 200)').setRequired(true)),

    run: async ({ interaction, message, args }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        const amount = interaction ? interaction.options.getInteger('amount') : parseInt(args[0]);

        try {
            // 1. Minimum Amount Check ($2 = 200 points)
            if (amount < 200) {
                const minErr = new EmbedBuilder()
                    .setAuthor({ name: ` Minimum Withdrawal`, iconURL: user.displayAvatarURL() })
                    .setDescription(`❌ Minimum withdraw amount is  **200 points ($2.00)** .`)
                    .setColor('#ff4b2b')
                    .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });
                
                return interaction ? interaction.editReply({ embeds: [minErr] }) : message.reply({ embeds: [minErr] });
            }

            const profile = await UserProfile.findOne({ userId: user.id });
            if (!profile || profile.balance < amount) {
                return (interaction || message).reply("❌ Insufficient balance!");
            }

            // 2. Stats Update
            profile.balance -= amount;
            profile.withdrawals += amount;
            profile.withdrawCount += 1;
            await profile.save();

            // 3. Success Embed with Ticket Link
            const withdrawEmbed = new EmbedBuilder()
                .setAuthor({ name: ` Withdrawal Requested`, iconURL: user.displayAvatarURL() })
                .setDescription(
                    `✅ Successfully withdrawn **🪙 ${amount} points**.\n\n` +
                    `⚠️ **Next Step:**\n` +
                    `Please **make a ticket** in <#1453079406829375729> to receive your payment.`
                )
                .setColor('#2ecc71')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            return interaction ? await interaction.editReply({ embeds: [withdrawEmbed] }) : await message.channel.send({ embeds: [withdrawEmbed] });
            
        } catch (e) { 
            console.error(e); 
            if (interaction) interaction.editReply("An error occurred.");
        }
    },
};