# Events Dashboard - Service-Based Version

This is a Streamlit-based dashboard application that connects to a backend service for managing events data.

## Features

- Interactive data filtering by country, event type, month, and year
- Real-time data visualization with charts and graphs
- Responsive layout with key metrics
- Data table with sorting and search capabilities
- CRUD operations through backend service

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Running backend service

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

## Configuration

Update the `.env` file with your backend service URL:
```
BACKEND_URL=http://localhost:8080
```

## Running the Application

To start the Streamlit application:
```bash
streamlit run app.py
```

The application will open in your default web browser at `http://localhost:8501`.

## API Dependencies

The application expects the following API endpoints from the backend service:

### Events
- GET `/api/events` - List events (with optional filters)
- POST `/api/events` - Create event
- PUT `/api/events/{id}` - Update event
- DELETE `/api/events/{id}` - Delete event
- GET `/api/events/stats` - Get event statistics

### Reference Data
- GET `/api/countries` - List countries
- GET `/api/event-types` - List event types
- GET `/api/exchanges` - List exchanges

## Contributing

Feel free to submit issues and enhancement requests! 