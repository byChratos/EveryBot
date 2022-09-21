const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const { clientId, guildId, token } = require('./config.json');

const commands = [];

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders){

    // Get the command files
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

    // Loads the commands from the files
    for (const file of commandFiles){
        const command = require(`./commands/${folder}/${file}`);
		commands.push(command.data.toJSON());

    }

}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();