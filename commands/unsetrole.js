const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { deleteRole } = require('../database/sqlite');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unsetrole')
        .setDescription('Removes a role assigned to a level.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The level assigned to the role')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const role = interaction.options.getRole('role');
        const level = interaction.options.getInteger('level');
        const guildId = interaction.guild.id;

        try {
            const result = await deleteRole(guildId, role.id, level);
            
            if (result.changes > 0) {
                await interaction.reply(`Role ${role} has been removed from level ${level}.`);
            } else {
                await interaction.reply(`No role ${role} was found assigned to level ${level}.`);
            }
        } catch (error) {
            interaction.reply('Failed to unset role.');
            console.error('Error unsetting role:', error);
        }
    }
}