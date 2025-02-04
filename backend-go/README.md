# Go Backend

A Go implementation of the Events Management System backend using the Gin framework.

## Features

- RESTful API implementation using Gin
- Multiple storage options (SQLite, PostgreSQL)
- CSV data management for dropdowns
- Automatic port selection starting from 5001
- Graceful shutdown handling
- CORS support
- API documentation endpoint

## Prerequisites

- Go 1.21+
- PostgreSQL (optional, for PostgreSQL storage)

## Setup

1. Initialize the Go module and install dependencies:
```bash
cd backend-go
go mod init events-api
go mod tidy
```

## Configuration

The application can be configured using environment variables:

```env
# Storage Configuration
STORAGE_TYPE=sqlite  # or "postgres"

# PostgreSQL Configuration (if using postgres)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=events_db
DB_USER=postgres
DB_PASSWORD=postgres

# SQLite Configuration (if using sqlite)
SQLITE_FILE=./data/events.db
```

## Project Structure

```
backend-go/
├── data/                  # CSV files for dropdown data
│   ├── countries.csv     # Country list with order
│   ├── exchanges.csv     # Exchange list with order
│   └── event_types.csv   # Event types with order
├── handlers/             # HTTP request handlers
├── models/              # Data models and database schema
├── storage/             # Storage implementations
├── main.go             # Application entry point
└── README.md           # This file
```

## API Endpoints

### Documentation
- `GET /` - API documentation

### Entries
- `GET /entries` - List all entries
- `POST /entries` - Create new entry
- `PUT /entries/:id` - Update entry
- `DELETE /entries/:id` - Delete entry

### Dropdowns
- `GET /dropdowns` - Get all dropdown values
- `POST /dropdowns/:key` - Add new dropdown value
- `DELETE /dropdowns/:key` - Delete dropdown value
- `PUT /dropdowns/:key/reorder` - Reorder dropdown values

### Events
- `GET /events` - List all events
- `POST /events` - Create new event

## Running the Server

```bash
go run main.go
```

The server will automatically select an available port starting from 5001.

## Data Format

### Entries
```json
{
  "id": "string",
  "date": "2024-02-15",
  "month": "February",
  "origin_country": "USA",
  "main_impact_country": "UK",
  "relevant_exchange": "NYSE",
  "event_type": "Conference",
  "who_input": "John Doe",
  "when_input": "2024-02-15T10:30:00Z",
  "details": "Event description"
}
```

### Dropdowns
```json
{
  "origin_country": [
    {"value": "USA", "order_index": 0},
    {"value": "UK", "order_index": 1}
  ],
  "relevant_exchange": [
    {"value": "NYSE", "order_index": 0},
    {"value": "NASDAQ", "order_index": 1}
  ],
  "event_type": [
    {"value": "Conference", "order_index": 0},
    {"value": "Merger", "order_index": 1}
  ]
}
```

## Development

1. Make sure you have Go 1.21 or later installed
2. Clone the repository and navigate to the Go backend:
```bash
git clone https://github.com/thinpo/evtsman.git
cd evtsman/backend-go
```
3. Install dependencies:
```bash
go mod tidy
```
4. Run the server:
```bash
go run main.go
```

## Testing

Run the tests with:
```bash
go test ./...
``` 