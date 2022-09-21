const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder, Message, DiscordAPIError } = require('discord.js');
const { Sequelize, QueryTypes } = require('sequelize');
const { database } = require('../../config.json');

const sequelize = new Sequelize(database);

this.name = 'roles';
this.description = 'Used to create reaction roles.';
this.cmdChannel = false;

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
                .setName('addrole')
                .setDescription('Allows you to add a role to a reaction role message.')
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
                        .setDescription('The id of the message you want to delete')
                        .setRequired(true))),
    
	async execute(interaction) {
        if(interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)){
            const sub = interaction.options.getSubcommand();
            
            //Create reaction role messages
            if(sub == 'create'){

                //Create new reaction role ID
                const [results, metadata] = await sequelize.query(`SELECT * FROM EB_roles_Messages ORDER BY id DESC`, {
                    type: QueryTypes.SELECT,
                    logging: false
                });

                let newId;
                if(results.id != 0){
                    newId = results.id + 1;
                }else{
                    newId = 1;
                }

                let footer = `Reaction Role ID: ${newId}`;

                //Create the reaction role message itself in Discord
                const reactionRoleEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('React to get your roles')
                    .setDescription('description not set')
                    .setTimestamp()
                    .setFooter({ text: footer })

                let sent = await interaction.channel.send({ embeds: [reactionRoleEmbed] });
                let message_id = sent.id;

                //Create the message in the database
                await sequelize.query(`INSERT INTO EB_roles_Messages(id, message_id) VALUES(?, ?)`,
                {
                    replacements: [newId, message_id],
                    type: QueryTypes.INSERT,
                    logging: false
                });

                return interaction.reply( { content: 'Message created', ephemeral: true } );

            //Add a role
            }else if(sub == 'addrole'){
                const id = interaction.options.getInteger('id');
                const role = interaction.options.getRole('role');
                const emoji = interaction.options.getString('emoji');

                const emoji_id = emoji.slice(emoji.length-20, -1);

                await sequelize.query(`SELECT message_id AS message_id FROM EB_roles_Messages WHERE id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id]
                }).then(result =>{
                    if(result.length == 0) return interaction.reply({ content: 'This ID does not exist '});

                    interaction.channel.messages.fetch(result[0].message_id)
                        .then(message => {
                            message.react(emoji);

                            let desc = message.embeds[0].description;
                            if(desc == "description not set"){
                                desc = `${emoji} - ${role.name}`;
                            }else{
                                desc = desc + `\n${emoji} - ${role.name}`;
                            }

                            let footer = `Reaction Role ID: ${id}`;

                            const reactionRoleEmbed = new EmbedBuilder()
                                .setColor('#0099ff')
                                .setTitle('React to get your roles')
                                .setDescription(desc)
                                .setTimestamp()
                                .setFooter({ text: footer })
                            message.edit({ embeds: [reactionRoleEmbed] });
                        })
                        .then(() => {
                            sequelize.query(`INSERT INTO EB_roles_EmojiForRole(id, emoji_id, role_id) VALUES(?, ?, ?)`,
                            {
                                replacements: [id, emoji_id.toString(), role.id],
                                type: QueryTypes.INSERT,
                                logging: false
                            })
                        })
                        .then(() => {
                            return interaction.reply({ content: 'Role added', ephemeral: true });
                        } );
                });


            //Remove a role
            }else if(sub == 'removerole'){
                const id = interaction.options.getInteger('id');
                const role = interaction.options.getRole('role');

                await sequelize.query(`SELECT * FROM EB_roles_EmojiForRole WHERE id = ? AND role_id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id, role.id]
                }).then(result => {
                    if(result.length == 0) return;

                    const resultEm = result;

                    sequelize.query(`SELECT message_id AS message_id FROM EB_roles_Messages WHERE id = ?`, {
                        type: QueryTypes.SELECT,
                        logging: false,
                        replacements: [id]
                    }).then(result =>{
                        if(result.length == 0) return interaction.reply({ content: 'This ID does not exist '});

                        interaction.channel.messages.fetch(result[0].message_id)
                            .then(message => {

                                let emoji_id = resultEm[0].emoji_id;
                                message.reactions.cache.get(emoji_id).remove()
                                    .catch(error => console.error('Failed to remove reactions:', error));
                                
                                let emoji = message.guild.emojis.cache.find(emoji => emoji.id === emoji_id);

                                let desc = message.embeds[0].description;
                                desc = desc.replace(`${emoji} - ${role.name}`, '');

                                desc = desc.replace('\n\n', '\n');

                                if(desc == '') desc = 'description not set';
                                if(desc.startsWith('\n')) desc = desc.slice(1);
                                if(desc.endsWith('\n')) desc = desc.slice(0, -2);

                                let footer = `Reaction Role ID: ${id}`;

                                const reactionRoleEmbed = new EmbedBuilder()
                                    .setColor('#0099ff')
                                    .setTitle('React to get your roles')
                                    .setDescription(desc)
                                    .setTimestamp()
                                    .setFooter({ text: footer })
                                message.edit({ embeds: [reactionRoleEmbed] });
                            })
                    }).then(() => {
                        sequelize.query(`DELETE FROM EB_roles_EmojiForRole WHERE id = ? AND role_id = ?`, {
                            type: QueryTypes.DELETE,
                            logging: false,
                            replacements: [id, role.id]
                        })
                    }).then(() => { 
                        return interaction.reply( { content: 'Role removed', ephemeral: true } );
                    });
                });

            //Delete reaction role messages
            }else if(sub == 'delete'){
                //Delete reaction role with ID
                const id = interaction.options.getInteger('id');

                await sequelize.query(`SELECT message_id AS message_id FROM EB_roles_Messages WHERE id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id]
                }).then(result =>{
                    if(result.length == 0) return interaction.repy({ content: 'This ID does not exist '});

                    interaction.channel.messages.fetch(result[0].message_id)
                        .then(messages => messages.delete())
                        .then(() => {sequelize.query(`DELETE FROM EB_roles_Messages WHERE id = ?`, {
                            type: QueryTypes.DELETE,
                            logging: false,
                            replacements: [id]
                        })} )
                        .then(() => {
                            sequelize.query(`DELETE FROM EB_roles_EmojiForRole WHERE id = ?`, {
                                type: QueryTypes.DELETE,
                                logging: false,
                                replacements: [id]
                            })
                        })
                        .then(() => {
                            return interaction.reply( { content: 'Message deleted', ephemeral: true } );
                    });
                });
            }
        }
    }
}