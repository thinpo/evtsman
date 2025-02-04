# Node.js Backend

This is the Node.js implementation of the backend API server using Express.

## Setup

1. Make sure you have Node.js 14+ installed
2. Install dependencies:
```bash
npm install
```

## Configuration

The server can be configured using environment variables:

- `STORAGE_TYPE`: Type of storage to use ('csv', 'postgres', or 'sqlite'). Defaults to 'csv'
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_NAME`: PostgreSQL database name (default: events_db)
- `DB_USER`: PostgreSQL user (default: postgres)
- `DB_PASSWORD`: PostgreSQL password (default: postgres)
- `SQLITE_FILE`: SQLite database file path (default: data/events.db)

## Running the Server

To start the server:

```bash
node server.js
```

The server will start on port 5001 (or the next available port if 5001 is busy).

## API Documentation

Visit `http://localhost:5001/` after starting the server to view the API documentation. 