const path = require('path');

const config = {
  csv: {
    dataPath: './data/data.csv',
    countriesPath: path.join(__dirname, 'data', 'countries.csv'),
    exchangesPath: path.join(__dirname, 'data', 'exchanges.csv'),
    eventTypesPath: path.join(__dirname, 'data', 'event_types.csv'),
    eventsPath: path.join(__dirname, 'data', 'events.csv')
  },
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'events_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  sqlite: {
    filename: process.env.SQLITE_FILE || path.join(__dirname, 'data', 'events.db')
  },
  // Set to 'csv', 'postgres', or 'sqlite'
  storageType: process.env.STORAGE_TYPE || 'csv'
};

module.exports = config; 