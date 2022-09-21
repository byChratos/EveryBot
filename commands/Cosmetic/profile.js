const { SlashCommandBuilder } = require('@discordjs/builders');
const { Sequelize, QueryTypes } = require('sequelize');
const Canvas = require('canvas');
const { AttachmentBuilder, MessageActionRow, MessageButton, ApplicationCommandManager, ButtonStyle } = require('discord.js');
const { database } = require('../../config.json');

// Database
const sequelize = new Sequelize(database);

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

		//const user = interaction.options.getUser('user');

		const user = (interaction.options.getUser('user') == null) ? interaction.user : interaction.options.getUser('user');

		let user_id = (user == null) ? (interaction.user.id) : (user.id);

		const canvas = Canvas.createCanvas(1200, 600);
		const context = canvas.getContext('2d');


		//Communism design
		//Background
		context.beginPath();
		context.fillStyle = '#8a0500';
		context.rect(0, 0, 1200, 600);
		context.fill();

		//"☭" text
		context.font = '160px sans-serif';
		context.fillStyle = '#f5ed00';
		context.save();
		context.translate(canvas.width - 200, 200);
		context.rotate(-Math.PI / 8);
		context.fillText('☭', 0, 0);
		context.restore();

		//Circle behind avatar / Left side
		context.beginPath();
		context.arc(150, 150, 133, 0, Math.PI * 2, true);
		context.fillStyle = '#f5ed00';
		context.fill();

		//Circle for avatar
		context.beginPath();
		context.arc(150, 150, 125, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();

		//Avatar
		Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }))
			.then(avatar => {
				context.drawImage(avatar, 25, 25, 259, 250);

				const attachment = new AttachmentBuilder(canvas.toBuffer(), 'profile-image.png');
				const row = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('test')
							.setLabel('Test')
							.setStyle(ButtonStyle.Primary),
						new MessageButton()
							.setCustomId('testt')
							.setLabel('Testt')
							.setStyle(ButtonStyle.Primary)
					);

				return interaction.reply({ files: [attachment], components: [row] });
			});

		//Anime design with pink and uwu
	},
	async executeButtons(interaction) {
		const buttonId = interaction.customId;
		if(buttonId == 'test'){
			console.log('Test button pressed');
		}
	},
};