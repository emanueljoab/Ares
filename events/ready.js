const { Events } = require('discord.js');
const { initializeDatabase } = require('../database/sqlite');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        initializeDatabase();
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};