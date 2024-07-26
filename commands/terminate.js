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
        const roleName = 'Membros';
        const role = interaction.guild.roles.cache.find(r => r.name === roleName);

        if (targetMember.roles.cache.some(role => role.name === roleName)) {
            try {
                const roles = targetMember.roles.cache.filter(role => role.id !== interaction.guild.id);
                await targetMember.roles.remove(roles);

                const embed = new EmbedBuilder()
                    .setDescription(`💀 ${targetUser.tag} has been terminated.`)
                    .setColor(0x8B0000);

                await interaction.reply({ embeds: [embed] })
                console.log(`${targetUser.tag} terminated`);
            } catch (error) {
                await interaction.reply({ content: 'An error occured while trying to terminate the user.', ephemeral: true });
                console.error('Error removing roles:', error);
            }
        } else {
            try {
                await targetMember.roles.add(role.id);

                const embed = new EmbedBuilder()
                    .setDescription(`↩️ ${targetUser.tag}'s termination reversed.`)
                    .setColor(0x8B0000);

                await interaction.reply({ embeds: [embed] });
                console.log(`${targetUser.tag}'s termination reversed`)
            } catch (error) {
                await interaction.reply({ content: 'An error occurred while trying to add the role.', ephemeral: true });
                console.error('Error adding role:', error);
            }
        }
    }            
}
