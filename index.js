const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token, activity, commandChannel } = require('./config.json');
const { Sequelize, QueryTypes } = require('sequelize');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

client.commands = new Collection();
client.cooldowns = new Collection();

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders){

    // Get the command files
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

    // Loads the commands from the files
    for (const file of commandFiles){
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);

    }

}

//Database connection
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect:  'sqlite',
    storage: 'database.db',
});

//Startup
client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity(activity);
});
client.on("warn", console.warn);
client.on("error", console.error);

//Reaction role adding roles
client.on('messageReactionAdd', async (reaction, user) => {

    //Exact code from discord.js v13 guide
    // When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    if(user.bot) return;

    await sequelize.query(`SELECT id AS id FROM roles_Messages WHERE message_id = ?`, {
        type: QueryTypes.SELECT,
        logging: false,
        replacements: [reaction.message.id]
    }).then(result => {
        if(result.length == 0) return;

        const id = result[0].id;
        sequelize.query(`SELECT role_id AS role_id FROM roles_EmojiForRole WHERE id = ? AND emoji_id = ?`, {
            type: QueryTypes.SELECT,
            logging: false,
            replacements: [id, reaction.emoji.id]
        }).then(second_result => {
            if(second_result.length == 0) return;
            
            const role_id = second_result[0].role_id;
            let role = reaction.message.guild.roles.cache.get(role_id);

            reaction.message.guild.members.fetch(user.id)
                .then(member => {
                    member.roles.add(role).catch(console.error);
                });

        })
    });

});

//Reaction roles remove roles
client.on('messageReactionRemove', async (reaction, user) => {

    //Exact code from discord.js v13 guide
    // When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

    if(user.bot) return;

    await sequelize.query(`SELECT id AS id FROM roles_Messages WHERE message_id = ?`, {
        type: QueryTypes.SELECT,
        logging: false,
        replacements: [reaction.message.id]
    }).then(result => {
        if(result.length == 0) return;

        const id = result[0].id;
        sequelize.query(`SELECT role_id AS role_id FROM roles_EmojiForRole WHERE id = ? AND emoji_id = ?`, {
            type: QueryTypes.SELECT,
            logging: false,
            replacements: [id, reaction.emoji.id]
        }).then(second_result => {
            if(second_result.length == 0) return;
            
            const role_id = second_result[0].role_id;
            let role = reaction.message.guild.roles.cache.get(role_id);

            reaction.message.guild.members.fetch(user.id)
                .then(member => {
                    member.roles.remove(role).catch(console.error);
                });

        })
    });

});

//Interactions
client.on('interactionCreate', async interaction => {
	//Returns if interaction is not a command
	if(!interaction.isCommand()) return;

	//Returns if interaction is triggered by bot, not sure if it is possible or not lol
	if(interaction.user.bot) return;

    const command = client.commands.get(interaction.commandName);

	// Message if the command is in a wrong channel
    if (command.cmdChannel){
        if (commandChannel !== "none" && interaction.channel.type !== 'dm'){
            if (commandChannel !== interaction.channel.id.toString()){
                client.channels.fetch(commandChannel)
                .then(channel => interaction.reply({ content: `Please use this channel to use commands: ${channel.toString()}`, ephemeral: true }));
                return;
            }
        }
    }

	//Returns if command does not exist
	if(!command) return;

	// Message if command cant be used in DMs
    if (command.guildOnly && interaction.channel.type === 'dm'){
        return interaction.reply('I can\'t execute that command inside DMs!')
    }

	// Cooldowns
    const { cooldowns } = client;

    if (!cooldowns.has(command.name)){
        cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(interaction.user.id)){
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime){
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true })
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try{
		//Execute the command based on the interaction
		await command.execute(interaction);
	}catch(error){
		//Error is self explanatory
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.login(token);