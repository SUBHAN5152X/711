const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../schemas/UserProfile"); // Logs ke mutabik path check kiya

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip another user points or USD equivalent')
        .addUserOption(option => option.setName('user').setDescription('The user to tip').setRequired(true))
        .addStringOption(option => option.setName('amount').setDescription('Amount (e.g. 100 or 0.25$)').setRequired(true)),

    run: async ({ interaction, message, args }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        try {
            const targetUser = interaction ? interaction.options.getUser('user') : message.mentions.users.first();
            const amountInput = interaction ? interaction.options.getString('amount') : args[1];

            if (!targetUser || targetUser.id === user.id || targetUser.bot) {
                return (interaction || message).reply("❌ Invalid user!");
            }

            let amount = amountInput.endsWith('$') ? parseFloat(amountInput.replace('$', '')) * 100 : parseFloat(amountInput);
            if (isNaN(amount) || amount <= 0) return (interaction || message).reply("❌ Invalid amount!");

            const senderProfile = await UserProfile.findOne({ userId: user.id });
            if (!senderProfile || senderProfile.balance < amount) return (interaction || message).reply("❌ Insufficient balance!");

            let receiverProfile = await UserProfile.findOne({ userId: targetUser.id }) || new UserProfile({ userId: targetUser.id, balance: 0 });

            senderProfile.balance -= amount;
            receiverProfile.balance += amount;
            await senderProfile.save();
            await receiverProfile.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Tip Sent Successfully`, iconURL: user.displayAvatarURL() })
                .setDescription(`✅ <@${user.id}> tipped **🪙 ${amount.toFixed(2)} points** to <@${targetUser.id}>`)
                .setColor('#00ffcc')
                // Footer mein logo add kiya
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() }) 
                .setTimestamp();

            return interaction ? await interaction.editReply({ embeds: [successEmbed] }) : await message.channel.send({ embeds: [successEmbed] });
        } catch (e) { console.log(e); }
    },
};