const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('terminate')
        .setDescription('Terminate a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to terminate')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        
        // Array de IDs dos cargos
        const roleIds = ['1265288017472520273', '1265716657054289941'];
        
        // Verifica se o usuário tem algum dos cargos especificados
        const hasAnyRole = targetMember.roles.cache.some(role => roleIds.includes(role.id));

        if (hasAnyRole) {
            try {
                // Remove todos os cargos exceto o @everyone
                const roles = targetMember.roles.cache.filter(role => role.id !== interaction.guild.id);
                await targetMember.roles.remove(roles);
                
                const embed = new EmbedBuilder()
                    .setDescription(`💀 ${targetUser.tag} has been terminated.`)
                    .setColor(0x8B0000);
                await interaction.reply({ embeds: [embed] });
                console.log(`${targetUser.tag} terminated`);
            } catch (error) {
                await interaction.reply({ content: 'An error occurred while trying to terminate the user.', ephemeral: true });
                console.error('Error removing roles:', error);
            }
        } else {
            try {
                // Adiciona todos os cargos especificados
                await targetMember.roles.add(roleIds);
                
                const embed = new EmbedBuilder()
                    .setDescription(`↩️ ${targetUser.tag}'s termination reversed.`)
                    .setColor(0x8B0000);
                await interaction.reply({ embeds: [embed] });
                console.log(`${targetUser.tag}'s termination reversed`);
            } catch (error) {
                await interaction.reply({ content: 'An error occurred while trying to add the roles.', ephemeral: true });
                console.error('Error adding roles:', error);
            }
        }
    }            
}
