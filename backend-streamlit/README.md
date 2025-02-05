# Events Dashboard - Streamlit Application

This is a Streamlit-based dashboard application for visualizing and managing events data.

## Features

- Interactive data filtering by country and event type
- Real-time data visualization with charts and graphs
- Responsive layout with key metrics
- Data table with sorting and search capabilities

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

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

## Running the Application

To start the Streamlit application, run:
```bash
streamlit run app.py
```

The application will open in your default web browser at `http://localhost:8501`.

## Data Structure

The application expects the following CSV files in the `../backend-go/data/` directory:
- `events.csv`: Contains event data
- `countries.csv`: Contains country information
- `event_types.csv`: Contains event type definitions

## Contributing

Feel free to submit issues and enhancement requests! 