const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('watch')
		.setDescription('Creates a YoutubeTogether room'),
	async execute(interaction) {
		if(interaction.member.voice == null){
            return interaction.reply('You have to be in a voice channel to do this');
        }

        interaction.member.voice.channel.createInvite(
            {
                maxAge: 7200,
                targetType: 2,
                targetApplication: "755600276941176913",
            }
        )
        .then(invite => interaction.reply(`https://discord.com/invite/${invite.code}`))
        .catch(console.error);
	},
};