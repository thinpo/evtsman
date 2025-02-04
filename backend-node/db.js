const { Pool } = require('pg');
const { initializeSQLite, closeSQLite } = require('./db/sqlite');
const config = require('./config');

let pool = null;

const initializeDB = async () => {
  if (config.storageType === 'postgres') {
    pool = new Pool(config.postgres);
    
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id VARCHAR(255) PRIMARY KEY,
        date DATE NOT NULL,
        month VARCHAR(20) NOT NULL,
        origin_country VARCHAR(100) NOT NULL,
        main_impact_country VARCHAR(100) NOT NULL,
        relevant_exchange VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        who_input VARCHAR(100) NOT NULL,
        when_input TIMESTAMP NOT NULL,
        details TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS countries (
        value VARCHAR(100) PRIMARY KEY,
        order_index INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS exchanges (
        value VARCHAR(100) PRIMARY KEY,
        order_index INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS event_types (
        value VARCHAR(100) PRIMARY KEY,
        order_index INTEGER NOT NULL DEFAULT 0
      );
    `);
  } else if (config.storageType === 'sqlite') {
    await initializeSQLite();
  }
};

const getPool = () => {
  if (!pool && config.storageType === 'postgres') {
    throw new Error('Database not initialized');
  }
  return pool;
};

const closeDB = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (config.storageType === 'sqlite') {
    await closeSQLite();
  }
};

module.exports = {
  initializeDB,
  getPool,
  closeDB
}; 