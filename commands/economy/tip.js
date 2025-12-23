const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require("../../schemas/UserProfile"); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip another user points or USD')
        .addUserOption(o => o.setName('user').setDescription('The user to tip').setRequired(true))
        .addStringOption(o => o.setName('amount').setDescription('Amount (e.g. 100 or 0.25$)').setRequired(true)),

    run: async ({ interaction, message, args }) => {
        const user = interaction ? interaction.user : message.author;
        
        // Interaction ko sirf ek baar defer karein
        if (interaction) await interaction.deferReply();

        try {
            const targetUser = interaction ? interaction.options.getUser('user') : message.mentions.users.first();
            const amountInput = interaction ? interaction.options.getString('amount') : (args ? args[1] : null);

            if (!targetUser || targetUser.id === user.id || targetUser.bot) {
                const err = "❌ Invalid user! Khud ko ya bot ko tip nahi de sakte.";
                return interaction ? interaction.editReply(err) : message.reply(err);
            }

            let amount = amountInput?.endsWith('$') ? parseFloat(amountInput.replace('$', '')) * 100 : parseFloat(amountInput);
            if (isNaN(amount) || amount <= 0) {
                const err = "❌ Sahi amount likho (e.g. 100 or 0.50$)";
                return interaction ? interaction.editReply(err) : message.reply(err);
            }

            const senderProfile = await UserProfile.findOne({ userId: user.id });
            if (!senderProfile || senderProfile.balance < amount) {
                const err = "❌ Aapke paas itne points nahi hain!";
                return interaction ? interaction.editReply(err) : message.reply(err);
            }

            let receiverProfile = await UserProfile.findOne({ userId: targetUser.id }) || new UserProfile({ userId: targetUser.id, balance: 0 });

            senderProfile.balance -= amount;
            receiverProfile.balance += amount;
            await senderProfile.save();
            await receiverProfile.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `crushmminfo: Tip Sent Successfully`, iconURL: user.displayAvatarURL() })
                .setDescription(`✅ <@${user.id}> tipped **🪙 ${amount.toFixed(2)} points** to <@${targetUser.id}>`)
                .setColor('#00ffcc')
                .setFooter({ text: '711 Bet', iconURL: user.client.user.displayAvatarURL() })
                .setTimestamp();

            // EditReply use karein kyunki humne deferReply kiya tha
            if (interaction) return await interaction.editReply({ embeds: [successEmbed] });
            return await message.channel.send({ embeds: [successEmbed] });

        } catch (error) {
            console.error("Tip Error:", error);
            // Error ke case mein bhi check karein ki reply ja chuka hai ya nahi
            if (interaction && !interaction.replied) {
                return await interaction.editReply("An error occurred while tipping.");
            }
        }
    },
};