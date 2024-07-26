const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { saveProfile, getProfile, getWarnings } = require('../database/sqlite');

let messageCache = {}; // Cache para armazenar IDs de mensagem

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Set or view a user\'s profile information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
        ),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const userId = targetUser.id;

            const existingProfile = await getProfile(userId);
            const member = await interaction.guild.members.fetch(interaction.user.id);
            const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

            if (existingProfile) {
                await showProfile(interaction, existingProfile, !isAdmin && userId !== interaction.user.id);
            } else {
                const profile = {
                    id: userId,
                    username: targetUser.username,
                    region: 'N/A',
                    platform: 'N/A',
                    gamertag: 'N/A',
                    tier: 'N/A'
                };
                await showProfile(interaction, profile, !isAdmin && userId !== interaction.user.id);
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
            }
        }
    },
    handleProfileModal,
    handleModalSubmit
};

async function showProfile(interaction, profile, disableEdit = false) {
    try {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        let displayRole = '``N/A``';
        const roleOrder = ['𓆩♛𓆪', '𓆩⁂𓆪', '𓆩⁑𓆪', 'Booster', 'Peasant', 'admin', 'MOD', 'Membros'];
        for (const roleName of roleOrder) {
            if (member.roles.cache.some(role => role.name === roleName)) {
                displayRole = `<@&${member.roles.cache.find(role => role.name === roleName).id}>`;
                break;
            }
        }

        const warnings = await getWarnings(user.id);
        const warningCount = warnings.length;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({
                name: `${user.username}'s Profile`,
                iconURL: user.displayAvatarURL({ format: 'png', dynamic: true }),
            })
            .addFields([
                {
                    name: '__Server stats__',
                    value: `<:members:1265290520804986952> ┃Perm: ${displayRole}\n\n<:crown:1265290647720693810>┃Tier: \`\`${profile.tier || 'N/A'}\`\`\n\n🎮┃Platform: \`\`${profile.platform || 'N/A'}\`\``,
                    inline: true
                },
                {
                    name: '** **',
                    value: `<:xbox:1265290407550517260>┃Gamertag: \`\`${profile.gamertag || 'N/A'}\`\`\n\n🗺️┃Region: \`\`${profile.region || 'N/A'}\`\`\n\n<:exclamation:1265290747171836021>┃Warnings: \`\`${warningCount}\`\``,
                    inline: true
                },
                {
                    name: '__User Stats__',
                    value: `⏱️┃Joined: ${member.joinedAt.toDateString()}\n<:member:1265290796249382993>┃Account Created: ${user.createdAt.toDateString()}`,
                    inline: false
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`update_profile:${user.id}`)
                    .setLabel('Update Profile')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disableEdit)
            );

        if (!interaction.replied) {
            const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            messageCache[user.id] = reply.id; // Armazene a ID da mensagem no cache
        } else {
            await interaction.followUp({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error('Error showing profile:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'An error occurred while showing the profile.', ephemeral: true });
        }
    }
}

async function handleProfileModal(interaction) {
    try {
        const [, userId] = interaction.customId.split(':');

        const modal = new ModalBuilder()
            .setCustomId(`profile_modal:${userId}`)
            .setTitle('Profile Information');

        const regionInput = new TextInputBuilder()
            .setCustomId('region')
            .setLabel("What's your region?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Europe, North America, Asia')
            .setRequired(false);

        const platformInput = new TextInputBuilder()
            .setCustomId('platform')
            .setLabel("What's your gaming platform?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. PC, PlayStation, Xbox, Switch')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(regionInput),
            new ActionRowBuilder().addComponents(platformInput)
        );

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (isAdmin) {
            const gamertagInput = new TextInputBuilder()
                .setCustomId('gamertag')
                .setLabel("What's your gamertag?")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g. XxGamerxX')
                .setRequired(false);

            const tierInput = new TextInputBuilder()
                .setCustomId('tier')
                .setLabel("What's your tier?")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g. Gold, Platinum, Diamond')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(gamertagInput),
                new ActionRowBuilder().addComponents(tierInput),
            );
        }

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error handling profile modal:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'An error occurred while handling the profile modal.', ephemeral: true });
        }
    }
}

async function handleModalSubmit(interaction) {
    try {
        const [, userId] = interaction.customId.split(':');

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

        const region = interaction.fields.getTextInputValue('region');
        const platform = interaction.fields.getTextInputValue('platform');
        const gamertag = isAdmin ? interaction.fields.getTextInputValue('gamertag') : null;
        const tier = isAdmin ? interaction.fields.getTextInputValue('tier') : null;

        const existingProfile = await getProfile(userId);

        const defaultProfile = {
            region: '',
            platform: '',
            gamertag: '',
            tier: ''
        };

        const targetUser = await interaction.client.users.fetch(userId);

        const profileUpdate = {
            id: userId,
            username: targetUser.username,
            region: region || (existingProfile ? existingProfile.region : defaultProfile.region),
            platform: platform || (existingProfile ? existingProfile.platform : defaultProfile.platform),
            gamertag: gamertag || (existingProfile ? existingProfile.gamertag : defaultProfile.gamertag),
            tier: tier || (existingProfile ? existingProfile.tier : defaultProfile.tier)
        };

        await saveProfile(profileUpdate);

        // Edita a mensagem original
        let displayRole = '``N/A``';
        const roleOrder = ['𓆩♛𓆪', '𓆩⁂𓆪', '𓆩⁑𓆪', 'Booster', 'Peasant', 'admin', 'MOD', 'Membros'];
        for (const roleName of roleOrder) {
            if (member.roles.cache.some(role => role.name === roleName)) {
                displayRole = `<@&${member.roles.cache.find(role => role.name === roleName).id}>`;
                break;
            }
        }

        const warnings = await getWarnings(targetUser.id);
        const warningCount = warnings.length;

        const channel = await interaction.channel.messages.fetch(messageCache[userId]);
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({
                name: `${targetUser.username}'s Profile`,
                iconURL: targetUser.displayAvatarURL({ format: 'png', dynamic: true }),
            })
            .addFields([
                {
                    name: '__Server stats__',
                    value: `<:members:1265290520804986952> ┃Perm: ${displayRole}\n\n<:crown:1265290647720693810>┃Tier: \`\`${profileUpdate.tier}\`\`\n\n🎮┃Platform: \`\`${profileUpdate.platform}\`\``,
                    inline: true
                },
                {
                    name: '** **',
                    value: `<:xbox:1265290407550517260>┃Gamertag: \`\`${profileUpdate.gamertag}\`\`\n\n🗺️┃Region: \`\`${profileUpdate.region}\`\`\n\n<:exclamation:1265290747171836021>┃Warnings: \`\`${warningCount}\`\``,
                    inline: true
                },
                {
                    name: '__User Stats__',
                    value: `⏱️┃Joined: ${interaction.member.joinedAt.toDateString()}\n<:member:1265290796249382993>┃Account Created: ${interaction.user.createdAt.toDateString()}`,
                    inline: false
                }
            ]);

        await channel.edit({ embeds: [embed] });

        await interaction.deferUpdate();
    } catch (error) {
        console.error('Error handling modal submit:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'An error occurred while handling the modal submit.', ephemeral: true });
        }
    }
}
