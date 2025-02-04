# Go Backend

This is the Go implementation of the backend API server using Gin framework.

## Setup

1. Make sure you have Go 1.21+ installed
2. Initialize the Go module and install dependencies:
```bash
cd backend-go
go mod init events-api
go mod tidy
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
go run main.go
```

The server will start on port 5001 (or the next available port if 5001 is busy).

## Project Structure

```
.
├── config/
│   └── config.go       # Configuration management
├── db/
│   └── db.go          # Database connection and models
├── models/
│   └── models.go      # Data models
├── utils/
│   ├── csv.go         # CSV file handling
│   └── errors.go      # Error handling
├── data/              # CSV files directory
├── go.mod             # Go module file
├── go.sum             # Go dependencies checksum
├── main.go            # Main application file
└── README.md          # This file
```

## API Documentation

Visit `http://localhost:5001/` after starting the server to view the API documentation. 