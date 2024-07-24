const { Events, PermissionsBitField } = require('discord.js');

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
                const [, userId] = interaction.customId.split(':');
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
                
                if (isAdmin || interaction.user.id === userId) {
                    await profileCommand.handleProfileModal(interaction);
                } else {
                    await interaction.reply({ content: 'You cannot update this profile.', ephemeral: true });
                }
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
    }
};