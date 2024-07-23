const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { saveProfile, getProfile } = require('../database/sqlite');

const currentYear = new Date().getFullYear();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Set or view your profile information'),
    async execute(interaction) {
        const existingProfile = await getProfile(interaction.user.id);

        if (existingProfile) {
            await showProfile(interaction, existingProfile);
        } else {
            await promptProfileCreation(interaction);
        }
    },
    handleProfileModal,
    handleModalSubmit
};

async function showProfile(interaction, profile) {
    const age = currentYear - profile.birthYear;

    const embed = {
        color: 0x0099FF,
        title: `Profile for ${profile.username}`,
        fields: [
            { name: 'Age', value: age, inline: true },
            { name: 'Region', value: profile.region || 'Not set', inline: true },
            { name: 'Platform', value: profile.platform || 'Not set', inline: true }
        ],
        timestamp: new Date(),
        footer: { text: 'Profile Information' }
    };

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('update_profile')
                .setLabel('Update Profile')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.reply({ embeds: [embed], components: [row] });
}

async function promptProfileCreation(interaction) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('create_profile')
                .setLabel('Create Profile')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.reply({ content: 'You don\'t have a profile yet. Would you like to create one?', components: [row] });
}

async function handleProfileModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('profile_modal')
        .setTitle('Profile Information');

    const birthYearInput = new TextInputBuilder()
        .setCustomId('birthyear')
        .setLabel("What's your birth year?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const regionInput = new TextInputBuilder()
        .setCustomId('region')
        .setLabel("What's your region?")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Europe, North America, Asia')
        .setRequired(true);

    const platformInput = new TextInputBuilder()
        .setCustomId('platform')
        .setLabel("What's your gaming platform?")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. PC, PlayStation, Xbox, Switch')
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(birthYearInput),
        new ActionRowBuilder().addComponents(regionInput),
        new ActionRowBuilder().addComponents(platformInput)
    );

    await interaction.showModal(modal);
}

async function handleModalSubmit(interaction) {
    const birthYear = interaction.fields.getTextInputValue('birthyear');
    const region = interaction.fields.getTextInputValue('region');
    const platform = interaction.fields.getTextInputValue('platform');

    const birthYearNumber = parseInt(birthYear);

    if (isNaN(birthYearNumber) || birthYearNumber < 1900 || birthYearNumber > currentYear) {
        await interaction.reply({ content: `You entered ${birthYear}. Please enter a valid birth year (between 1900 and ${currentYear}).`, ephemeral: true });
        return;
    }
    
    const profile = {
        id: interaction.user.id,
        username: interaction.user.username,
        birthYear: parseInt(birthYear),
        region,
        platform
    };
    
    await saveProfile(profile);
    
    await interaction.reply({ content: 'Your profile has been updated!', ephemeral: true });
}
