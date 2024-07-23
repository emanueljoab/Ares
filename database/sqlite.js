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
                        birth_year INTEGER,
                        region TEXT,
                        platform TEXT
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
        const { id, username, birthYear, region, platform } = profile;
        db.run(`INSERT OR REPLACE INTO profiles (id, username, birth_year, region, platform) VALUES (?, ?, ?, ?, ?)`, 
            [id, username, birthYear, region, platform], 
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
                if (row && row.birth_year) {
                    row.birthYear = parseInt(row.birth_year, 10); // Converta para número, se necessário
                }
                resolve(row);
            }
            db.close();
        });
    });
}

module.exports = { initializeDatabase, saveProfile, getProfile };