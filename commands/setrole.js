const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { insertRole } = require('../database/sqlite')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setrole')
        .setDescription('Set a role to be given at a specific level')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to be given')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The level required to receive the role')
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
            await insertRole(guildId, role.id, level);
            await interaction.reply(`Role ${role} set to level ${level}.`)
        } catch (error) {
            interaction.reply('Failed to set role.')
            console.error('Error setting role:', error);
        }
    }
}