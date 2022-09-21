const fs = require('fs');
const { Client, Collection, GatewayIntentBits, Partials, AttachmentBuilder } = require('discord.js');
const { token, activity, commandChannel, database } = require('./config.json');
const { Sequelize, QueryTypes } = require('sequelize');
const Canvas = require('canvas');


const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
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

const sequelize = new Sequelize(database);

//Startup
client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity(activity);
});
client.on("warn", console.warn);
client.on("error", console.error);

//Text for image manipulation
const applyText = (canvas, text) => {
	const context = canvas.getContext('2d');
	let fontSize = 70;

	do {
		context.font = `${fontSize -= 10}px sans-serif`;
	} while (context.measureText(text).width > canvas.width - 300);

	return context.font;
};

//Server joined image
client.on('guildMemberAdd', (member) => {
    const guild = member.guild;


    if(!guild.systemChannel) return;

    const name = member.displayName;

    const canvas = Canvas.createCanvas(1024, 512);
    const context = canvas.getContext('2d');

    Canvas.loadImage('./images/world.jpg')
        .then(background => {
            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            //Right rect
            context.beginPath();
            context.fillStyle = '#37393f';
            context.rect(256, canvas.height / 4, 1024, canvas.height / 2.5);
            context.fill();


            //Left rect
            context.beginPath();
            context.fillStyle = '#32353b';
            context.rect(0, canvas.height / 4, 256, canvas.height / 2.5);
            context.fill();

            //"Welcome" text
            context.font = '40px sans-serif';
            context.fillStyle = '#e4f257';
            context.fillText('Welcome', canvas.width / 2, canvas.height / 2.5);

            //Name text
            context.font = applyText(canvas, `${name}!`);
            context.fillStyle = '#e4f257';
            context.fillText(`${name}!`, canvas.width / 2, canvas.height / 1.8);

            //Circle behind avatar / Right side
            context.beginPath();
            context.arc(256, 256, 187.5, Math.PI / 2, (Math.PI/2) * 3, true);
            context.fillStyle = '#37393f';
            context.fill();

            //Circle behind avatar / Left side
            context.beginPath();
            context.arc(256, 256, 187.5, (Math.PI/2) * 3, Math.PI/2, true);
            context.fillStyle = '#32353b';
            context.fill();

            //Circle for avatar
            context.beginPath();
            context.arc(256, 256, 175, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();

            //Avatar
            Canvas.loadImage(member.displayAvatarURL({ format: 'jpg' }))
                .then(avatar => {
                    context.drawImage(avatar, 81, 81, 350, 350);

                    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profile-image.png' });

                    return guild.systemChannel.send({ files: [attachment] });
                })
        })
});

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

    await sequelize.query(`SELECT id AS id FROM EB_roles_Messages WHERE message_id = ?`, {
        type: QueryTypes.SELECT,
        logging: false,
        replacements: [reaction.message.id]
    }).then(result => {
        if(result.length == 0) return;

        const id = result[0].id;
        sequelize.query(`SELECT role_id AS role_id FROM EB_roles_EmojiForRole WHERE id = ? AND emoji_id = ?`, {
            type: QueryTypes.SELECT,
            logging: false,
            replacements: [id, reaction.emoji.toString().slice(reaction.emoji.toString().length-20, -1)]
        }).then(second_result => {
            if(second_result.length == 0) return reaction.remove();
            
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

    await sequelize.query(`SELECT id AS id FROM EB_roles_Messages WHERE message_id = ?`, {
        type: QueryTypes.SELECT,
        logging: false,
        replacements: [reaction.message.id]
    }).then(result => {
        if(result.length == 0) return;

        const id = result[0].id;
        sequelize.query(`SELECT role_id AS role_id FROM EB_roles_EmojiForRole WHERE id = ? AND emoji_id = ?`, {
            type: QueryTypes.SELECT,
            logging: false,
            replacements: [id, reaction.emoji.toString().slice(reaction.emoji.toString().length-20, -1)]
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

//Autocomplete handler
client.on('interactionCreate', async interaction => {
    if(!interaction.isAutocomplete()) return;

    const command = client.commands.get(interaction.commandName);
    if(!command) return;

    const focusedOption = interaction.options.getFocused(true);
    command.auto(focusedOption.name)
        .then(wantedOption => {
            let choices = command.autocomplete[wantedOption];
            if(!choices) return;

            const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
            interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice})),
            );
        })
});

//Button handler // Calls the executeButtons function of the command
client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) return;

    const command = client.commands.get(interaction.message.interaction.commandName);
    try{
		//Execute the commands button code to have it in one place together with the rest of the command and not in this index file
		await command.executeButtons(interaction);
	}catch(error){
		//Error is self explanatory
		console.error(error);
		await interaction.reply({ content: 'There was an error while processing the button interaction!', ephemeral: true });
	}
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