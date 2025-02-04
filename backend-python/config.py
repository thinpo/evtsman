import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    # CSV Configuration
    CSV = {
        'data_path': str(BASE_DIR / 'data' / 'data.csv'),
        'countries_path': str(BASE_DIR / 'data' / 'countries.csv'),
        'exchanges_path': str(BASE_DIR / 'data' / 'exchanges.csv'),
        'event_types_path': str(BASE_DIR / 'data' / 'event_types.csv'),
        'events_path': str(BASE_DIR / 'data' / 'events.csv')
    }

    # PostgreSQL Configuration
    POSTGRES = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 5432)),
        'database': os.getenv('DB_NAME', 'events_db'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres')
    }

    # SQLite Configuration
    SQLITE = {
        'filename': os.getenv('SQLITE_FILE', str(BASE_DIR / 'data' / 'events.db'))
    }

    # Storage Type: 'csv', 'postgres', or 'sqlite'
    STORAGE_TYPE = os.getenv('STORAGE_TYPE', 'csv') 