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
        
        // Nome do cargo
        const roleName = 'Peasant';
        const role = interaction.guild.roles.cache.find(role => role.name === roleName);

        // Verifica se o usuário já tem o cargo
        const hasRole = targetMember.roles.cache.has(role.id);

        try {
            if (hasRole) {
                // Remove o cargo "Peasant"
                await targetMember.roles.remove(role);

                const embed = new EmbedBuilder()
                    .setDescription(`💀 ${targetUser.tag} has been terminated.`)
                    .setColor(0x8B0000);
                await interaction.reply({ embeds: [embed] });
                console.log(`${targetUser.tag} terminated`);
            } else {
                // Adiciona o cargo "Peasant"
                await targetMember.roles.add(role);

                const embed = new EmbedBuilder()
                    .setDescription(`↩️ ${targetUser.tag}'s termination reversed.`)
                    .setColor(0x8B0000);
                await interaction.reply({ embeds: [embed] });
                console.log(`${targetUser.tag}'s termination reversed`);
            }
        } catch (error) {
            await interaction.reply({ content: 'An error occurred while trying to modify the user\'s role.', ephemeral: true });
            console.error('Error modifying role:', error);
        }
    }
}
