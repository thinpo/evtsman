const sqlite3 = require('sqlite3').verbose();
const config = require('../config');
const { DatabaseError } = require('../utils/errors');

let db = null;

const initializeSQLite = async () => {
  return new Promise((resolve, reject) => {
    if (config.storageType === 'sqlite') {
      db = new sqlite3.Database(config.sqlite.filename, async (err) => {
        if (err) {
          reject(new DatabaseError('Failed to initialize SQLite database', err));
          return;
        }

        try {
          await createTables();
          resolve();
        } catch (error) {
          reject(new DatabaseError('Failed to create SQLite tables', error));
        }
      });
    } else {
      resolve();
    }
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        // Create countries table
        db.run(`
          CREATE TABLE IF NOT EXISTS countries (
            value TEXT PRIMARY KEY,
            order_index INTEGER NOT NULL DEFAULT 0
          )
        `);

        // Create exchanges table
        db.run(`
          CREATE TABLE IF NOT EXISTS exchanges (
            value TEXT PRIMARY KEY,
            order_index INTEGER NOT NULL DEFAULT 0
          )
        `);

        // Create event_types table
        db.run(`
          CREATE TABLE IF NOT EXISTS event_types (
            value TEXT PRIMARY KEY,
            order_index INTEGER NOT NULL DEFAULT 0
          )
        `);

        // Create events table
        db.run(`
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            event_type TEXT REFERENCES event_types(value),
            origin_country TEXT REFERENCES countries(value),
            main_impact_country TEXT REFERENCES countries(value),
            relevant_exchange TEXT REFERENCES exchanges(value),
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(new DatabaseError('Failed to create events table', err));
          else resolve();
        });
      } catch (err) {
        reject(new DatabaseError('Failed to create database tables', err));
      }
    });
  });
};

const getDB = () => {
  if (!db && config.storageType === 'sqlite') {
    throw new DatabaseError('Database not initialized');
  }
  return db;
};

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      db.run(query, params, function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new DatabaseError('Database constraint violation', err));
          } else {
            reject(new DatabaseError('Failed to execute query', err));
          }
        } else {
          resolve(this);
        }
      });
    } catch (err) {
      reject(new DatabaseError('Unexpected error during query execution', err));
    }
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(new DatabaseError('Failed to execute query', err));
        } else {
          resolve(rows);
        }
      });
    } catch (err) {
      reject(new DatabaseError('Unexpected error during query execution', err));
    }
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      db.get(query, params, (err, row) => {
        if (err) {
          reject(new DatabaseError('Failed to execute query', err));
        } else {
          resolve(row);
        }
      });
    } catch (err) {
      reject(new DatabaseError('Unexpected error during query execution', err));
    }
  });
};

const closeSQLite = async () => {
  if (db) {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(new DatabaseError('Failed to close database connection', err));
        } else {
          db = null;
          resolve();
        }
      });
    });
  }
};

module.exports = {
  initializeSQLite,
  getDB,
  runQuery,
  allQuery,
  getQuery,
  closeSQLite
}; 