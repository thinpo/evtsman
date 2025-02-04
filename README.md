# Events Management System

A web application for tracking and managing global business events, mergers, acquisitions, and market activities across different countries and exchanges.

## Features

- **Event Management**
  - Add, edit, and delete events
  - Track events with detailed information:
    - Date and Month
    - Origin and Impact Countries
    - Relevant Exchange
    - Event Type (Merger, Acquisition, IPO, etc.)
    - Event Details
    - Input Tracking (Who/When)

- **Data Organization**
  - Dropdown selections for standardized input
  - Support for multiple exchanges (NYSE, NASDAQ, LSE, etc.)
  - Country-based event tracking
  - Event type categorization

- **Flexible Storage**
  - Supports CSV, PostgreSQL, and SQLite storage
  - Easy switching between storage types
  - Automatic data persistence

## Technology Stack

- **Frontend**
  - React.js
  - Axios for API calls
  - Modern UI with responsive design

- **Backend**
  - Node.js
  - Express.js
  - CSV file handling
  - PostgreSQL database support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (optional, if using PostgreSQL storage)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. Backend configuration (`backend/config.js`):
   - Set storage type (CSV, PostgreSQL, or SQLite)
   - Configure database connection (if using PostgreSQL)
   - Configure SQLite database path (if using SQLite)
   - Adjust CSV file paths if needed

2. Environment variables:
   ```env
   # For PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=events_db
   DB_USER=postgres
   DB_PASSWORD=postgres

   # For SQLite
   SQLITE_FILE=./data/events.db

   # Storage Type (csv, postgres, or sqlite)
   STORAGE_TYPE=csv
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
   The server will run on port 5001 by default.

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```
   The application will open in your browser at http://localhost:3000

### Test Data

The project includes a script to generate test data:
```bash
cd backend
node test-data.js
```
This will populate the system with sample events covering various scenarios.

## API Endpoints

- `GET /entries` - Retrieve all entries
- `POST /entries` - Create a new entry
- `PUT /entries/:id` - Update an existing entry
- `DELETE /entries/:id` - Delete an entry
- `GET /dropdowns` - Get all dropdown options
- `POST /dropdowns/:key` - Add a new dropdown value
- `DELETE /dropdowns/:key` - Remove a dropdown value
- `PUT /dropdowns/:key/reorder` - Reorder dropdown values

## Data Structure

### Event Entry
```javascript
{
  date: "YYYY-MM-DD",
  month: "Month Name",
  origin_country: "Country Name",
  main_impact_country: "Country Name",
  relevant_exchange: "Exchange Name",
  event_type: "Event Type",
  who_input: "User Name",
  when_input: "YYYY-MM-DDTHH:mm:ss",
  details: "Event Description"
}
```

### CSV Format
The CSV storage uses the following columns:
```csv
id,date,month,origin_country,main_impact_country,relevant_exchange,event_type,who_input,when_input,details
```

Example:
```csv
1,2024-02-15,February,USA,China,NYSE,Market Expansion,Test User,2024-02-15T10:30:00,Event description
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 