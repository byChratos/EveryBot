const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed, Message, DiscordAPIError } = require('discord.js');
const { Sequelize, QueryTypes } = require('sequelize');

// Database

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect:  'sqlite',
    storage: 'database.db',
});

this.name = 'roles';
this.description = 'Used to create reaction roles.'

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Moderation',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
        .addSubcommand(subcommand => 
            subcommand
                .setName('create')
                .setDescription('Creates a new reaction role message.'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('edit')
                .setDescription('Edit an existing reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The id of the message you want to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The field you want to edit.')
                        .setRequired(true)
                        .addChoice('Title', 'title')
                        .addChoice('Description', 'description'))
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('The text you want to have in the chosen field.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('addrole')
                .setDescription('Allows you to add a role from a reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the reaction role message you want to add the role to.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role that you should receive.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The Emoji you have to react with in order to get the role.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removerole')
                .setDescription('Allows you to remove a role from a reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the reaction role message you want to remove the role from.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role that you shouldn\'t receive anymore.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes an existing reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The id of the message you want to edit')
                        .setRequired(true))),
    
	async execute(interaction) {
        if(interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)){
            const sub = interaction.options.getSubcommand();
            
            //Create reaction role messages
            if(sub == 'create'){

                //Create new reaction role ID
                const [results, metadata] = await sequelize.query(`SELECT * FROM roles_Messages ORDER BY id DESC`, {
                    type: QueryTypes.SELECT,
                    logging: false
                });

                let newId;
                if(results.id != 0){
                    newId = results.id + 1;
                }else{
                    newId = 1;
                }

                //Create the reaction role message itself in Discord
                const reactionRoleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Title not set')
                    .setDescription('Description not set')
                    .setTimestamp()
                    .setFooter(`Reaction Role ID: ${newId}`)

                let sent = await interaction.channel.send({ embeds: [reactionRoleEmbed] });
                let message_id = sent.id;

                //Create the message in the database
                await sequelize.query(`INSERT INTO roles_Messages(id, message_id) VALUES(?, ?)`,
                {
                    replacements: [newId, message_id],
                    type: QueryTypes.INSERT,
                    logging: false
                });

            //Add a role
            }else if(sub == 'addrole'){
                const id = interaction.options.getInteger('id');
                const role = interaction.options.getRole('role');
                const emoji = interaction.options.getString('emoji');


            //Remove a role
            }else if(sub == 'removerole'){
                const id = interaction.options.getInteger('id');
                const role = interaction.options.getRole('role');

            //Edit reaction role messages
            }else if(sub == 'edit'){
                //Edit reaction role with ID
                const id = interaction.options.getInteger('id');
                const field = interaction.options.getString('field');
                const text = interaction.options.getString('text');

            //Delete reaction role messages
            }else if(sub == 'delete'){
                //Delete reaction role with ID
                const id = interaction.options.getInteger('id');

                const [results, metadata] = await sequelize.query(`SELECT message_id AS message_id FROM roles_Messages WHERE id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id]
                });
                let msg = interaction.channel.fetch_message(results.message_id);
                console.log(typeof msg);
            }

            //Create reaction role message
            /*
            Needed:
                Link to database

                Message content
                Message picture,.
                Message title
                Roles with icon

                Actual role handler
            */
        }
        return 0;
    }
}