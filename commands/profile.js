const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { saveProfile, getProfile, getWarnings, getUserLevel } = require('../database/sqlite');

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

            const userLevel = await getUserLevel(userId, interaction.guild.id);
            const level = userLevel ? userLevel.level : 1;
            const xp = userLevel ? userLevel.xp : 0;
            const nextLevelXp = Math.pow((level + 1) / 0.1, 2); // XP necessário para o próximo nível
            const progressBar = createProgressBar(xp, nextLevelXp);

            if (existingProfile) {
                await showProfile(interaction, existingProfile, !isAdmin && userId !== interaction.user.id, level, progressBar);
            } else {
                const profile = {
                    id: userId,
                    username: targetUser.username,
                    region: 'N/A',
                    platform: 'N/A',
                    gamertag: 'N/A',
                    tier: '`N/A`'
                };
                await showProfile(interaction, profile, !isAdmin && userId !== interaction.user.id, level, progressBar);
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

async function showProfile(interaction, profile, disableEdit = false, level = 1, progressBar = '') {
    try {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        const highestRole = member.roles.highest;

        // Define o displayRole com o maior cargo, ou 'N/A' se não tiver cargos
        const displayRole = highestRole ? `<@&${highestRole.id}>` : '``N/Aa``';

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
                    value: `<:members:1265290520804986952> ┃Perm: ${displayRole}\n\n<:crown:1265290647720693810>┃Tier: ${profile.tier || '``N/Aa``'}\n\n🎮┃Platform: \`\`${profile.platform || 'N/A'}\`\``,
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
            ])
            .setDescription(`🏆┃Level: \`\`${level}\`\`\n${progressBar}`);

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

function createProgressBar(currentXp, nextLevelXp) {
    const totalBlocks = 20; // Número total de blocos na barra de progresso
    const filledBlocks = Math.floor((currentXp / nextLevelXp) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return `${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)} (${Math.round((currentXp / nextLevelXp) * 100)}%)`;
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
                .setPlaceholder('Insert only the letter, e.g. S, A, B, C, D')
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

        const tierToRole = {
            'S': 'Apex (S Tier)',
            'A': 'Maestro (A Tier)',
            'B': 'Specialist (B Tier)',
            'C': 'Operator (C Tier)',
            'D': 'Apprentice (D Tier)'
        };

        let tierRoleId = null;

        if (isAdmin && tier) {
            const upperTier = tier.toUpperCase();
            const roleName = tierToRole[upperTier];
            if (roleName) {
                const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                if (role) {
                    const targetMember = await interaction.guild.members.fetch(userId);
                    // Remova todos os cargos de tier anteriores
                    for (const tierRole of Object.values(tierToRole)) {
                        const existingRole = interaction.guild.roles.cache.find(r => r.name === tierRole);
                        if (existingRole && targetMember.roles.cache.has(existingRole.id)) {
                            await targetMember.roles.remove(existingRole);
                        }
                    }
                    // Adicione o novo cargo de tier
                    await targetMember.roles.add(role);
                    tierRoleId = role.id;
                }
            }
        }

        const userLevel = await getUserLevel(userId, interaction.guild.id);
        const level = userLevel ? userLevel.level : 1;
        const xp = userLevel ? userLevel.xp : 0;
        const nextLevelXp = Math.pow((level + 1) / 0.1, 2);
        const progressBar = createProgressBar(xp, nextLevelXp);

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
            tier: tierRoleId ? `<@&${tierRoleId}>` : (existingProfile ? existingProfile.tier : defaultProfile.tier)
        };

        await saveProfile(profileUpdate);
      
        const highestRole = member.roles.highest;

        // Define o displayRole com o maior cargo, ou 'N/A' se não tiver cargos
        const displayRole = highestRole ? `<@&${highestRole.id}>` : '``N/A``';

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
                    value: `<:members:1265290520804986952> ┃Perm: ${displayRole}\n\n<:crown:1265290647720693810>┃Tier: ${profileUpdate.tier || '`N/A`'}\n\n🎮┃Platform: \`${profileUpdate.platform || 'N/A'}\``,
                    inline: true
                },
                {
                    name: '\u200B',
                    value: `<:xbox:1265290407550517260>┃Gamertag: \`${profileUpdate.gamertag || 'N/A'}\`\n\n🗺️┃Region: \`${profileUpdate.region || 'N/A'}\`\n\n<:exclamation:1265290747171836021>┃Warnings: \`${warningCount}\``,
                    inline: true
                },
                {
                    name: '__User Stats__',
                    value: `⏱️┃Joined: ${interaction.member.joinedAt.toDateString()}\n<:member:1265290796249382993>┃Account Created: ${interaction.user.createdAt.toDateString()}`,
                    inline: false
                }
            ])
            .setDescription(`🏆┃Level: \`${level}\`\n${progressBar}`);

        await channel.edit({ embeds: [embed] });

        await interaction.deferUpdate();
    } catch (error) {
        console.error('Error handling modal submit:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'An error occurred while handling the modal submit.', ephemeral: true });
        }
    }
}
