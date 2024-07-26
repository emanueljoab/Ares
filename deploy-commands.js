require("dotenv").config();

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Caminho para a pasta 'commands'
const commandsPath = path.join(__dirname, 'commands');
// Lista todos os arquivos na pasta 'commands'
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Processa cada arquivo de comando
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Constrói e prepara uma instância do módulo REST
const rest = new REST().setToken(process.env.TOKEN);

// Implementa seus comandos
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// O método put é usado para atualizar totalmente todos os comandos na guilda com o conjunto atual
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.clientId, process.env.guildId),
			
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// Captura e registra quaisquer erros
		console.error(error);
	}
})();
