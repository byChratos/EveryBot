const { SlashCommandBuilder } = require('@discordjs/builders');

this.name = 'profile';
this.description = 'WIP';
this.cmdChannel = true;

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Cosmetic',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user you want to see the profile of.')
				.setRequired(false)
		),
	async execute(interaction) {
		//Description(custom Textbox), Links, if its your own profile settings wheel as button to change stuff


		return interaction.reply({ content: 'Boop!', ephemeral: true });
	},
};