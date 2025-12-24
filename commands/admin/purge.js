const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: {
        name: 'purge',
        description: 'Channel ko delete karke naya bana deta hai (Chat saaf karne ke liye)',
        default_member_permissions: PermissionFlagsBits.ManageChannels,
    },

    run: async ({ interaction }) => {
        // 1. Pehle permission check kar lo
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: "❌ Aapke paas permissions nahi hain!", ephemeral: true });
        }

        try {
            // 2. Purane channel ka data nikaal lo
            const oldChannel = interaction.channel;
            const channelName = oldChannel.name;
            const channelParent = oldChannel.parent;
            const channelPosition = oldChannel.position;
            const channelType = oldChannel.type;
            const channelPermissions = oldChannel.permissionOverwrites.cache;

            // 3. User ko batao ki kaam shuru ho gaya hai
            await interaction.reply({ content: "🧼 Purging channel... Alvida!", ephemeral: true });

            // 4. Purana channel delete karo
            await oldChannel.delete();

            // 5. Naya channel banao (Same settings ke saath)
            const newChannel = await interaction.guild.channels.create({
                name: channelName,
                type: channelType,
                parent: channelParent,
                position: channelPosition,
                permissionOverwrites: channelPermissions
            });

            // 6. Naye channel mein message bhejo
            await newChannel.send(`🧹 **Channel Purged!** \nAction performed by: ${interaction.user.tag}`);

        } catch (error) {
            console.error("Purge Error:", error);
            // Agar interaction fail ho jaye toh console mein dikhega
        }
    }
};