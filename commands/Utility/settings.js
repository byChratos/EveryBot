const { SlashCommandBuilder, Embed } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');
const { Sequelize, QueryTypes } = require('sequelize');

// Database
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect:  'sqlite',
    storage: 'database.db',
});

this.name = 'settings';
this.description = 'Allows you to see the current EveryBot settings and change them up, if you want of course.';
this.cmdChannel = false;

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Utility',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description),
	async execute(interaction) {
		//Set command Channel etc.
        if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return interaction.reply({ content:  'Sorry, but you need to be an administrator to do that.', ephemeral: true });



        const settingsEmbed = new MessageEmbed()
            .setColor('#51de28')
            .setTitle('EveryBot Settings')
            .setAuthor('EveryBot Settings', 'https://i.imgur.com/LAB3Ef9.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            .addFields(
                { name: 'Command Channel:', value: 'n' },
                { name: 'Yes', value: 'n' },
            )
            .setFooter('Click on the buttons to change a certain setting or see how it is possible to change it.')
            .setTimestamp();

        return interaction.reply({ embeds: [settingsEmbed] });
	},
};