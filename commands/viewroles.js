const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRoles } = require('../database/sqlite'); // Ajuste o caminho conforme necessário

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewroles')
        .setDescription('View roles assigned to levels'),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        try {
            const roles = await getRoles(guildId);

            if (roles.length === 0) {
                return interaction.reply('No roles are currently assigned to any levels.');
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Roles Assigned to Levels')
                .setDescription('Here are the current role assignments:');

            roles.forEach(role => {
                embed.addFields({ name: `Level ${role.level}`, value: `<@&${role.role}>`, inline: true });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching roles:', error);
            await interaction.reply('An error occurred while fetching the roles.');
        }
    },
};