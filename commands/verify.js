const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Send a verification message with a button to verify users.'),
    async execute(interaction) {
        // Verifica se o usuário é administrador
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Cria um botão com o customId 'verify_button'
        const button = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Success);

        // Cria uma ActionRow com o botão
        const row = new ActionRowBuilder()
            .addComponents(button);

        // Envia a mensagem de verificação com o botão
        await interaction.reply({ content: 'Click on verify to ensure you are not a bot.', components: [row] });

        // Fica aguardando indefinidamente a interação com o botão
        const filter = i => i.customId === 'verify_button';
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        collector.on('collect', async i => {
            const phantomRole = i.guild.roles.cache.find(role => role.name === 'Phantom');
            const peasantRole = i.guild.roles.cache.find(role => role.name === 'Peasant');

            if (!phantomRole || !peasantRole) {
                return i.reply({ content: 'Roles not found.', ephemeral: true });
            }

            // Verifica se o usuário já possui o cargo "Peasant"
            if (i.member.roles.cache.has(peasantRole.id)) {
                return i.reply({ content: 'You have already been verified.', ephemeral: true });
            }

            try {
                // Remove o cargo "Phantom" e adiciona o cargo "Peasant"
                await i.member.roles.remove(phantomRole);
                await i.member.roles.add(peasantRole);

                await i.reply({ content: 'Verification successful! You now have access to the server.', ephemeral: true });
            } catch (error) {
                console.error('Failed to update roles:', error);
                await i.reply({ content: 'There was an error while verifying.', ephemeral: true });
            }
        });
    },
};
