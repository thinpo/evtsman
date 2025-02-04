from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, DateTime, text
from sqlalchemy.pool import QueuePool
from datetime import datetime
from config import Config

engine = None
metadata = MetaData()

# Define tables
entries = Table('entries', metadata,
    Column('id', String, primary_key=True),
    Column('date', String),
    Column('month', String),
    Column('origin_country', String),
    Column('main_impact_country', String),
    Column('relevant_exchange', String),
    Column('event_type', String),
    Column('who_input', String),
    Column('when_input', DateTime),
    Column('details', String)
)

countries = Table('countries', metadata,
    Column('value', String, primary_key=True),
    Column('order_index', Integer)
)

exchanges = Table('exchanges', metadata,
    Column('value', String, primary_key=True),
    Column('order_index', Integer)
)

event_types = Table('event_types', metadata,
    Column('value', String, primary_key=True),
    Column('order_index', Integer)
)

events = Table('events', metadata,
    Column('id', Integer, primary_key=True),
    Column('event_name', String),
    Column('event_type', String),
    Column('origin_country', String),
    Column('main_impact_country', String),
    Column('relevant_exchange', String),
    Column('month', String),
    Column('year', String),
    Column('description', String),
    Column('created_at', DateTime, default=datetime.utcnow)
)

def initialize_db():
    """Initialize database connection based on configuration."""
    global engine
    
    if Config.STORAGE_TYPE == 'postgres':
        db_url = f"postgresql://{Config.POSTGRES['user']}:{Config.POSTGRES['password']}@{Config.POSTGRES['host']}:{Config.POSTGRES['port']}/{Config.POSTGRES['database']}"
        engine = create_engine(db_url, poolclass=QueuePool)
    elif Config.STORAGE_TYPE == 'sqlite':
        db_url = f"sqlite:///{Config.SQLITE['filename']}"
        engine = create_engine(db_url)
    
    if engine and Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        metadata.create_all(engine)

def get_db():
    """Get database engine."""
    if not engine and Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        initialize_db()
    return engine

def close_db():
    """Close database connection."""
    if engine:
        engine.dispose() 