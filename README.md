# Events Management System

A full-stack web application for managing events and related data with multiple backend implementations.

## Project Structure

```
.
├── frontend/               # React frontend application
├── backend-node/          # Node.js (Express) implementation
├── backend-python/        # Python (Flask) implementation
└── backend-go/           # Go (Gin) implementation
```

## Features

- Full CRUD operations for events and entries
- Dropdown management system with drag-and-drop reordering
- Multiple storage options (SQLite, PostgreSQL)
- Error boundary handling for graceful error recovery
- Responsive and modern UI
- API documentation
- Environment-based configuration
- Automatic port selection
- Graceful shutdown handling

## Frontend (React)

The frontend is built with React and includes:

- Modern UI with responsive design
- Drag-and-drop functionality for reordering lists
- Error boundary for graceful error handling
- Dynamic form validation
- Real-time updates
- Comprehensive error handling

### Running the Frontend

```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000`.

## Backend Implementations

All backend implementations provide identical API endpoints and functionality:

### API Endpoints

- `GET /` - API documentation
- `GET /entries` - List all entries
- `POST /entries` - Create new entry
- `PUT /entries/:id` - Update entry
- `DELETE /entries/:id` - Delete entry
- `GET /dropdowns` - Get all dropdown values
- `POST /dropdowns/:key` - Add new dropdown value
- `DELETE /dropdowns/:key` - Delete dropdown value
- `PUT /dropdowns/:key/reorder` - Reorder dropdown values
- `GET /events` - List all events
- `POST /events` - Create new event

Choose any of the backend implementations based on your preference:

1. [Node.js (Express)](./backend-node/README.md)
2. [Python (Flask)](./backend-python/README.md)
3. [Go (Gin)](./backend-go/README.md)

## Data Structure

### Entries
- ID
- Date
- Month
- Origin Country
- Main Impact Country
- Relevant Exchange
- Event Type
- Who Input
- When Input
- Details

### Dropdowns
- Countries
- Exchanges
- Event Types

Each dropdown item contains:
- Value
- Order Index

## Configuration

All backends support configuration through environment variables:

- `STORAGE_TYPE` - "sqlite" or "postgres"
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `SQLITE_FILE` - SQLite database file path

## Development

1. Clone the repository:
```bash
git clone https://github.com/thinpo/evtsman.git
cd evtsman
```

2. Start the frontend and any backend of your choice following their respective README instructions.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 