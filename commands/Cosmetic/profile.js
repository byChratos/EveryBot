const { SlashCommandBuilder } = require('@discordjs/builders');
const { Sequelize, QueryTypes } = require('sequelize');
const Canvas = require('canvas');
const { MessageAttachment, MessageActionRow, MessageButton, ApplicationCommandManager } = require('discord.js');

// Database
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect:  'sqlite',
    storage: 'database.db',
});

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
		//Maybe an image as the profile with the links as buttons?

		const user = interaction.options.getUser('user');
		var user_id = (user == null) ? (interaction.user.id) : (user.id);

		const canvas = Canvas.createCanvas(1200, 600);
		const context = canvas.getContext('2d');

		//Background
		context.beginPath();
		context.fillStyle = '#37393f';
		context.rect(0, 0, 1200, 600);
		context.fill();

		


		const attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('test')
					.setLabel('Test')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('testt')
					.setLabel('Testt')
					.setStyle('PRIMARY')
			);

		return interaction.reply({ files: [attachment], components: [row] });
	},
	async executeButtons(interaction) {
		const buttonId = interaction.customId;
		if(buttonId == 'test'){
			console.log('Test button pressed');
		}
	},
};