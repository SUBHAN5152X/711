const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip another user points or USD equivalent')
        .addUserOption(option => option.setName('user').setDescription('The user to tip').setRequired(true))
        .addStringOption(option => option.setName('amount').setDescription('Amount (e.g. 100 or 0.25$)').setRequired(true)),

    run: async ({ interaction, message, args }) => {
        if (interaction) await interaction.deferReply();

        try {
            const sender = interaction ? interaction.user : message.author;
            const targetUser = interaction ? interaction.options.getUser('user') : message.mentions.users.first();
            const amountInput = interaction ? interaction.options.getString('amount') : args[1];

            if (!targetUser || targetUser.id === sender.id) {
                return (interaction || message).reply("❌ Khud ko ya kisi invalid user ko tip nahi de sakte!");
            }

            // Amount Parse Karna (Points vs USD)
            let amount;
            if (amountInput.endsWith('$')) {
                const usd = parseFloat(amountInput.replace('$', ''));
                amount = usd * 100; // Maan lo 1$ = 100 points
            } else {
                amount = parseFloat(amountInput);
            }

            if (isNaN(amount) || amount <= 0) return (interaction || message).reply("❌ Sahi amount likho!");

            const senderProfile = await UserProfile.findOne({ userId: sender.id });
            if (!senderProfile || senderProfile.balance < amount) {
                return (interaction || message).reply("❌ Aapke paas itne points nahi hain!");
            }

            let receiverProfile = await UserProfile.findOne({ userId: targetUser.id });
            if (!receiverProfile) receiverProfile = new UserProfile({ userId: targetUser.id, balance: 0 });

            // Transaction
            senderProfile.balance -= amount;
            receiverProfile.balance += amount;
            await senderProfile.save();
            await receiverProfile.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Tip Sent Successfully`, iconURL: sender.displayAvatarURL() })
                .setDescription(`✅ <@${sender.id}> tipped **🪙 ${amount.toFixed(2)} points** to <@${targetUser.id}>`)
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet' })
                .setTimestamp();

            if (interaction) return await interaction.editReply({ embeds: [successEmbed] });
            return await message.channel.send({ embeds: [successEmbed] });

        } catch (error) {
            console.error("Tip Error:", error);
            if (interaction) interaction.editReply("Error while tipping!");
        }
    },
};