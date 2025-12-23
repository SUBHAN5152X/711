module.exports = (message) => {
    if (message.author.bot) return;

    if (message.content === 'rules') {
        message.reply('Check <#1452300789115785341> !!');
    }
}