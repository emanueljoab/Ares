const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveWarning, getWarnings, deleteWarning } = require('../database/sqlite');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const warnings = await getWarnings(targetUser.id);

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${targetUser.tag}'s Warnings`,
                iconURL: targetUser.displayAvatarURL({ format: 'png', dynamic: true }),
            })
            .setColor(0xff0000);

        if (warnings.length > 0) {
            warnings.forEach(warn => {
                embed.addFields({ name: `Warn ID #${warn.warn_id}`, value: `Reason: ${warn.reason}`, inline: true });
            });
        } else {
            embed.addFields({ name: 'No warnings.', value: '\u200B', inline: false });
        }

        const addButton = new ButtonBuilder()
            .setCustomId(`add_warn_${targetUser.id}`)
            .setLabel('Add Warn')
            .setStyle(ButtonStyle.Danger);

        const deleteButton = new ButtonBuilder()
            .setCustomId(`delete_warn_${targetUser.id}`)
            .setLabel('Delete Warn')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(addButton, deleteButton);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    },

    async handleButton(interaction) {
        const [action, , userId] = interaction.customId.split('_');
        const user = await interaction.client.users.fetch(userId);

        // Verifica se o usuário tem permissão para adicionar ou deletar warnings
        if (action === 'add' || action === 'delete') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: 'You do not have permission to use this action.', ephemeral: true });
            }

            if (action === 'add') {
                const modal = new ModalBuilder()
                    .setCustomId(`warn_modal_${user.id}`)
                    .setTitle('Add a Warning');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Reason')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
            } else if (action === 'delete') {
                const modal = new ModalBuilder()
                    .setCustomId(`delete_warn_modal_${user.id}`)
                    .setTitle('Delete a Warning');

                const warnIdInput = new TextInputBuilder()
                    .setCustomId('warn_id')
                    .setLabel('Warn ID to delete')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(warnIdInput));
                await interaction.showModal(modal);
            }
        } else {
            await interaction.reply({ content: 'Invalid action.', ephemeral: true });
        }
    },

    async handleModalSubmit(interaction) {
        const parts = interaction.customId.split('_');
        
        let action, userId;
    
        if (parts[0] === 'delete' && parts[1] === 'warn' && parts[2] === 'modal') {
            action = 'delete';
            userId = parts[3];
        } else if (parts[0] === 'warn' && parts[1] === 'modal') {
            action = 'add';
            userId = parts[2];
        } else {
            console.error('Invalid customId format:', parts);
            await interaction.reply({ content: 'Error processing the command. Invalid customId format.', ephemeral: true });
            return;
        }
       
        if (!userId) {
            console.error('User ID not found in customId');
            await interaction.reply({ content: 'Error processing the command. User ID not found.', ephemeral: true });
            return;
        }
    
        let user;
        try {
            user = await interaction.client.users.fetch(userId);
        } catch (error) {
            console.error('Error when searching for user:', error);
            await interaction.reply({ content: 'Error fetching user information.', ephemeral: true });
            return;
        }
    
        if (action === 'add') {
            const reason = interaction.fields.getTextInputValue('reason');
            await saveWarning({ user_id: user.id, user_name: user.tag, reason });
            await interaction.reply({ content: `Warn added to ${user.tag}.`, ephemeral: true });
        } else if (action === 'delete') {
            const warnId = interaction.fields.getTextInputValue('warn_id');
            try {
                await deleteWarning(warnId, user.id);
                await interaction.reply({ content: `Warn ID ${warnId} has been deleted.`, ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: `Failed to delete warning: ${error.message}`, ephemeral: true });
                return;
            }
        }
    
        // Atualizar a lista de avisos
        const warnings = await getWarnings(user.id);
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${user.tag}'s Warnings`,
                iconURL: user.displayAvatarURL({ format: 'png', dynamic: true }),
            })
            .setColor(0xff0000);
    
        if (warnings.length > 0) {
            warnings.forEach(warn => {
                embed.addFields({ name: `Warn ID #${warn.warn_id}`, value: `Reason: ${warn.reason}`, inline: true });
            });
        } else {
            embed.addFields({ name: 'No warnings.', value: '\u200B', inline: false });
        }
    
        const addButton = new ButtonBuilder()
            .setCustomId(`add_warn_${user.id}`)
            .setLabel('Add Warn')
            .setStyle(ButtonStyle.Danger);
    
        const deleteButton = new ButtonBuilder()
            .setCustomId(`delete_warn_${user.id}`)
            .setLabel('Delete Warn')
            .setStyle(ButtonStyle.Secondary);
    
        const row = new ActionRowBuilder().addComponents(addButton, deleteButton);
    
        try {
            await interaction.message.edit({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Erro ao editar a mensagem:', error);
            await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
        }
    }
};
