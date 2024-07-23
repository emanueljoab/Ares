const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'update_profile' || interaction.customId === 'create_profile') {
                const profileCommand = interaction.client.commands.get('profile');
                await profileCommand.handleProfileModal(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'profile_modal') {
                const profileCommand = interaction.client.commands.get('profile');
                await profileCommand.handleModalSubmit(interaction);
            }
        }
    },
};