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
		.setDescription(this.description),
	async execute(interaction) {
		return interaction.reply({ content: 'Boop!', ephemeral: true });
	},
};