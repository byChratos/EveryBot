const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

this.name = 'giverole';
this.description = 'Gives a role to multiple people.';
this.cmdChannel = true;

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Moderation',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role you want to add to multiple people.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('The first user you want to give the role to')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('The second user you want to give the role to')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user3')
                .setDescription('The third user you want to give the role to')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user4')
                .setDescription('The fourth user you want to give the role to')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user5')
                .setDescription('The fifth user you want to give the role to')
                .setRequired(false)),
    async execute(interaction){
        if(interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)){
            
            const role = interaction.options.getRole('role');
            let userStr;
            var users = [];
            users.push(interaction.options.getUser('user1'));
            users.push(interaction.options.getUser('user2'));
            users.push(interaction.options.getUser('user3'));
            users.push(interaction.options.getUser('user4'));
            users.push(interaction.options.getUser('user5'));

            userStr = users[0].username;

            users.forEach(function(item, index, array){

                if(item == null) return;
                if(index != 0) userStr += ', ' + item.username;

                interaction.guild.members.fetch(item.id)
                    .then(member => {
                        member.roles.add(role).catch(console.error);
                    })
            });
            return interaction.reply({ content: `Given ${role.name} to the ${userStr}`, ephemeral: true });
        }else{
			return interaction.reply({ content: 'You do not have enough permissions to do that', ephemeral: true });
		}
    }
}