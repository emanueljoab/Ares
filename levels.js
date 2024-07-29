const { Events, EmbedBuilder } = require('discord.js');
const { getUserLevel, updateUserLevel, getRolesByLevel } = require('./database/sqlite');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const userId = message.author.id;
        const username = message.author.username;
        const guildId = message.guild.id;
        const guild = message.guild;

        // Obtendo os dados atuais do usuário
        let userLevel = await getUserLevel(userId, guildId);

        if (!userLevel) {
            // Se o usuário não tiver um nível ainda, inicializa com 0 xp e nível 1
            userLevel = { userId, username, guildId, xp: 0, level: 1 };
        }

        // Incrementa a experiência do usuário
        userLevel.xp += 10;

        // Calcula o novo nível com base na XP acumulada
        const newLevel = Math.floor(0.1 * Math.sqrt(userLevel.xp));

        if (newLevel > userLevel.level) {
            userLevel.level = newLevel;

            const embed = new EmbedBuilder()
                .setDescription(`${username} has leveled up to level ${newLevel}!`)
                .setColor('#ADD8E6');

            message.channel.send({ embeds: [embed] });
        }

        // Atualiza o banco de dados com os novos valores de XP e nível
        await updateUserLevel(userId, username, guildId, userLevel.xp, userLevel.level);

        const roleIds = await getRolesByLevel(guildId, userLevel.level);
        const member = await guild.members.fetch(userId);

        if (roleIds.length > 0) {
            // Adiciona os cargos novos
            for (const roleId of roleIds) {
                const role = guild.roles.cache.get(roleId);
                if (role && !member.roles.cache.has(roleId)) {
                    await member.roles.add(role);
                    console.log(`Added role ${role} to user ${username}`);

                    const embed = new EmbedBuilder()
                        .setDescription(`Added role ${role} to user ${username}.`)

                    message.channel.send({ embeds: [embed]});
                }
            }
        }
    }
};
