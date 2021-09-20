const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Let's you play games with friends")
        .addStringOption(option =>
            option.setName('game')
                .setDescription('The game to play')
                .setRequired(true)),
    async execute(interaction){
        const game = interaction.options.getString('game');

        if(interaction.member.voice == null){
            return interaction.reply('You have to be in a voice channel to do this');
        }

        let applicationID = " ";

        if (game.toLowerCase() == 'chess'){
            applicationID = '832012586023256104';
        }else if(game.toLowerCase() == 'poker'){
            applicationID = '755827207812677713';
        }else if(game.toLowerCase() == 'betrayal'){
            applicationID = '773336526917861400';
        }else if(game.toLowerCase() == 'fishing'){
            applicationID = '814288819477020702';
        }else{
            return interaction.reply({ content: 'This game does not exist', ephemeral: true })
        }

        interaction.member.voice.channel.createInvite(
            {
                maxAge: 7200,
                targetType: 2,
                targetApplication: applicationID,
            }
        )
        .then(invite => interaction.reply(`https://discord.com/invite/${invite.code}`))
        .catch(console.error);

    }
}