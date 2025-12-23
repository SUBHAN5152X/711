const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// FIXED PATH: Sirf do bar ../
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip another user')
        .addUserOption(o => o.setName('user').setDescription('User to tip').setRequired(true))
        .addStringOption(o => o.setName('amount').setDescription('Amount (e.g. 100 or 0.25$)').setRequired(true)),

    run: async ({ interaction, message, args }) => {
        const user = interaction ? interaction.user : message.author;
        if (interaction) await interaction.deferReply();

        try {
            const targetUser = interaction ? interaction.options.getUser('user') : (message.mentions.users.first());
            const amountInput = interaction ? interaction.options.getString('amount') : (args ? args[1] : null);

            if (!targetUser || targetUser.id === user.id || targetUser.bot) return (interaction || message).reply("❌ Invalid user!");

            let amount = amountInput?.endsWith('$') ? parseFloat(amountInput.replace('$', '')) * 100 : parseFloat(amountInput);
            if (isNaN(amount) || amount <= 0) return (interaction || message).reply("❌ Invalid amount!");

            const sender = await UserProfile.findOne({ userId: user.id });
            if (!sender || sender.balance < amount) return (interaction || message).reply("❌ Insufficient balance!");

            let receiver = await UserProfile.findOne({ userId: targetUser.id }) || new UserProfile({ userId: targetUser.id, balance: 0 });

            sender.balance -= amount;
            receiver.balance += amount;
            await sender.save();
            await receiver.save();

            const tipEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Tip Sent Successfully`, iconURL: user.displayAvatarURL() })
                .setDescription(`✅ <@${user.id}> tipped **🪙 ${amount.toFixed(2)} points** to <@${targetUser.id}>`)
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() });

            return interaction ? await interaction.editReply({ embeds: [tipEmbed] }) : await message.channel.send({ embeds: [tipEmbed] });
        } catch (e) { console.error(e); }
    },
};