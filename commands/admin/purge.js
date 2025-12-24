const { PermissionFlagsBits } = require('discord.js');

// Jab aap channel delete karke naya bana rahe ho:
const oldChannel = interaction.channel;
const channelParent = oldChannel.parent; // Category check
const channelPosition = oldChannel.position; // Position check
const channelPermissions = oldChannel.permissionOverwrites.cache; // Ye sabse zaroori hai

try {
    // 1. Pehle purana channel delete karo
    await oldChannel.delete();

    // 2. Naya channel banao wahi same settings ke saath
    const newChannel = await interaction.guild.channels.create({
        name: oldChannel.name,
        type: oldChannel.type,
        parent: channelParent,
        position: channelPosition,
        permissionOverwrites: channelPermissions, // Yahan saari private settings copy ho rahi hain
        topic: oldChannel.topic
    });

    // 3. Success message naye channel mein bhejo
    await newChannel.send({ 
        content: "✨ Channel has been cleared and permissions have been restored!" 
    }).then(msg => {
        setTimeout(() => msg.delete(), 5000); // 5 sec baad msg delete
    });

} catch (error) {
    console.error("Purge Error:", error);
}