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
                console.error('Error executing command:', error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            const profileCommand = interaction.client.commands.get('profile');
            const warnCommand = interaction.client.commands.get('warn');
            if (!profileCommand || !warnCommand) {
                console.error('Profile or Warn command not found.');
                return;
            }
            if (interaction.customId.startsWith('update_profile:')) {
                await profileCommand.handleProfileModal(interaction);
            } else if (interaction.customId.startsWith('admin_update_profile:')) {
                await profileCommand.handleAdminModal(interaction);
            } else if (interaction.customId.startsWith('add_warn_')) {
                await warnCommand.handleButton(interaction);
            } else if (interaction.customId.startsWith('delete_warn_')) {
                await warnCommand.handleButton(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            const profileCommand = interaction.client.commands.get('profile');
            const warnCommand = interaction.client.commands.get('warn');
            if (!profileCommand || !warnCommand) {
                console.error('Profile or Warn command not found.');
                return;
            }
            if (interaction.customId.startsWith('profile_modal:')) {
                await profileCommand.handleModalSubmit(interaction);
            } else if (interaction.customId.startsWith('admin_profile_modal:')) {
                await profileCommand.handleAdminModalSubmit(interaction);
            } else if (interaction.customId.startsWith('warn_modal_')) {
                await warnCommand.handleModalSubmit(interaction);
            } else if (interaction.customId.startsWith('delete_warn_modal_')) {
                await warnCommand.handleModalSubmit(interaction);
            }
        }
    },
};
 