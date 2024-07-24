const sqlite3 = require('sqlite3').verbose();
const path = require('node:path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Could not connect to database', err);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                db.serialize(() => {
                    db.run(`CREATE TABLE IF NOT EXISTS profiles (
                        id TEXT PRIMARY KEY,
                        username TEXT,
                        region TEXT,
                        platform TEXT,
                        gamertag TEXT,
                        tier TEXT
                    )`);
                    db.run(`CREATE TABLE IF NOT EXISTS warnings (
                        warn_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        user_name TEXT,
                        reason TEXT
                    )`, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                        db.close();
                    });
                });
            }
        });
    });
}

function saveProfile(profile) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        const { id, username, region, platform, gamertag, tier } = profile;
        db.run(`INSERT OR REPLACE INTO profiles (id, username, region, platform, gamertag, tier) VALUES (?, ?, ?, ?, ?, ?)`, 
            [id, username, region, platform, gamertag, tier], 
            (err) => {
                if (err) {
                    console.error('Could not save profile', err);
                    reject(err);
                } else {
                    console.log('Profile saved');
                    resolve();
                }
                db.close();
            }
        );
    });
}

function getProfile(userId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.get('SELECT * FROM profiles WHERE id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
            db.close();
        });
    });
}

function saveWarning(warning) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        const { user_id, user_name, reason } = warning;
        db.run(`INSERT INTO warnings (user_id, user_name, reason) VALUES (?, ?, ?)`, 
            [user_id, user_name, reason], 
            (err) => {
                if (err) {
                    console.error('Could not save warning', err);
                    reject(err);
                } else {
                    console.log('Warning saved');
                    resolve();
                }
                db.close();
            }
        );
    });
}

function getWarnings(userId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.all('SELECT * FROM warnings WHERE user_id = ?', [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
            db.close();
        });
    });
}

function deleteWarning(warnId, userId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.run('DELETE FROM warnings WHERE warn_id = ? AND user_id = ?', [warnId, userId], function(err) {
            if (err) {
                console.error('Could not delete warning', err);
                reject(err);
            } else {
                if (this.changes > 0) {
                    console.log('Warning deleted');
                    resolve();
                } else {
                    reject(new Error('Warning not found or user mismatch'));
                }
            }
            db.close();
        });
    });
}

module.exports = { initializeDatabase, saveProfile, getProfile, saveWarning, getWarnings, deleteWarning };