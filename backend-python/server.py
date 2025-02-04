from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import os
from pathlib import Path
from sqlalchemy import text

from config import Config
from db import initialize_db, get_db, close_db
from utils.errors import NotFoundError, ValidationError, handle_error, async_handler

app = Flask(__name__)
CORS(app)

# Initialize database if using PostgreSQL or SQLite
if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
    initialize_db()

def read_csv(file_path):
    """Read CSV file and return as list of dictionaries."""
    if not os.path.exists(file_path):
        # Create empty CSV if it doesn't exist
        pd.DataFrame(columns=['value', 'order_index']).to_csv(file_path, index=False)
    return pd.read_csv(file_path).to_dict('records')

def write_csv(file_path, data):
    """Write data to CSV file."""
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)

@app.route('/entries', methods=['GET'])
@async_handler
def get_entries():
    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            result = conn.execute(text('SELECT * FROM entries ORDER BY when_input DESC'))
            entries = [dict(row) for row in result]
        return jsonify(entries)
    else:
        entries = read_csv(Config.CSV['data_path'])
        return jsonify(entries)

@app.route('/entries', methods=['POST'])
@async_handler
def create_entry():
    data = request.json
    required_fields = ['date', 'month', 'origin_country', 'main_impact_country',
                      'relevant_exchange', 'event_type', 'who_input', 'when_input', 'details']
    
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")

    entry_id = str(int(datetime.now().timestamp() * 1000))
    new_entry = {**data, 'id': entry_id}

    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            query = text("""
                INSERT INTO entries (id, date, month, origin_country, main_impact_country,
                relevant_exchange, event_type, who_input, when_input, details)
                VALUES (:id, :date, :month, :origin_country, :main_impact_country,
                :relevant_exchange, :event_type, :who_input, :when_input, :details)
                RETURNING *
            """)
            result = conn.execute(query, new_entry)
            entry = dict(result.first())
        return jsonify(entry)
    else:
        entries = read_csv(Config.CSV['data_path'])
        entries.append(new_entry)
        write_csv(Config.CSV['data_path'], entries)
        return jsonify(new_entry)

@app.route('/entries/<entry_id>', methods=['PUT'])
@async_handler
def update_entry(entry_id):
    data = request.json

    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            query = text("""
                UPDATE entries SET
                date = :date, month = :month, origin_country = :origin_country,
                main_impact_country = :main_impact_country, relevant_exchange = :relevant_exchange,
                event_type = :event_type, who_input = :who_input, when_input = :when_input,
                details = :details
                WHERE id = :id RETURNING *
            """)
            result = conn.execute(query, {**data, 'id': entry_id})
            entry = result.first()
            
            if not entry:
                raise NotFoundError('Entry not found')
            return jsonify(dict(entry))
    else:
        entries = read_csv(Config.CSV['data_path'])
        entry_index = next((i for i, e in enumerate(entries) if str(e['id']) == entry_id), None)
        
        if entry_index is None:
            raise NotFoundError('Entry not found')
            
        entries[entry_index] = {**entries[entry_index], **data}
        write_csv(Config.CSV['data_path'], entries)
        return jsonify(entries[entry_index])

@app.route('/entries/<entry_id>', methods=['DELETE'])
@async_handler
def delete_entry(entry_id):
    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            result = conn.execute(
                text('DELETE FROM entries WHERE id = :id RETURNING *'),
                {'id': entry_id}
            )
            if not result.first():
                raise NotFoundError('Entry not found')
    else:
        entries = read_csv(Config.CSV['data_path'])
        new_entries = [e for e in entries if str(e['id']) != entry_id]
        
        if len(new_entries) == len(entries):
            raise NotFoundError('Entry not found')
            
        write_csv(Config.CSV['data_path'], new_entries)
    
    return jsonify({'success': True})

@app.route('/dropdowns', methods=['GET'])
@async_handler
def get_dropdowns():
    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            countries = [row['value'] for row in conn.execute(text('SELECT value FROM countries ORDER BY order_index ASC'))]
            exchanges = [row['value'] for row in conn.execute(text('SELECT value FROM exchanges ORDER BY order_index ASC'))]
            event_types = [row['value'] for row in conn.execute(text('SELECT value FROM event_types ORDER BY order_index ASC'))]
    else:
        countries = sorted(read_csv(Config.CSV['countries_path']), key=lambda x: x.get('order_index', 0))
        exchanges = sorted(read_csv(Config.CSV['exchanges_path']), key=lambda x: x.get('order_index', 0))
        event_types = sorted(read_csv(Config.CSV['event_types_path']), key=lambda x: x.get('order_index', 0))
        
        countries = [c['value'] for c in countries]
        exchanges = [e['value'] for e in exchanges]
        event_types = [t['value'] for t in event_types]

    return jsonify({
        'origin_country': countries,
        'main_impact_country': countries,
        'relevant_exchange': exchanges,
        'event_type': event_types
    })

@app.route('/dropdowns/<key>', methods=['POST'])
@async_handler
def add_dropdown_value(key):
    value = request.json.get('value')
    if not value:
        raise ValidationError('Value is required')

    if key in ['origin_country', 'main_impact_country']:
        table = 'countries'
        file_path = Config.CSV['countries_path']
    elif key == 'relevant_exchange':
        table = 'exchanges'
        file_path = Config.CSV['exchanges_path']
    elif key == 'event_type':
        table = 'event_types'
        file_path = Config.CSV['event_types_path']
    else:
        raise ValidationError('Invalid dropdown key')

    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            # Get max order_index
            result = conn.execute(text(f'SELECT COALESCE(MAX(order_index), -1) as max_order FROM {table}'))
            next_order = result.scalar() + 1
            
            # Insert new value
            conn.execute(
                text(f'INSERT INTO {table} (value, order_index) VALUES (:value, :order_index) ON CONFLICT DO NOTHING'),
                {'value': value, 'order_index': next_order}
            )
            
            # Get updated values
            result = conn.execute(text(f'SELECT value FROM {table} ORDER BY order_index ASC'))
            values = [row['value'] for row in result]
    else:
        data = read_csv(file_path)
        if not any(row['value'] == value for row in data):
            max_order = max([-1] + [row.get('order_index', 0) for row in data])
            data.append({'value': value, 'order_index': max_order + 1})
            write_csv(file_path, data)
        values = [row['value'] for row in sorted(data, key=lambda x: x.get('order_index', 0))]

    return jsonify(values)

@app.route('/dropdowns/<key>', methods=['DELETE'])
@async_handler
def delete_dropdown_value(key):
    value = request.json.get('value')
    if not value:
        raise ValidationError('Value is required')

    if key in ['origin_country', 'main_impact_country']:
        table = 'countries'
        file_path = Config.CSV['countries_path']
    elif key == 'relevant_exchange':
        table = 'exchanges'
        file_path = Config.CSV['exchanges_path']
    elif key == 'event_type':
        table = 'event_types'
        file_path = Config.CSV['event_types_path']
    else:
        raise ValidationError('Invalid dropdown key')

    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            result = conn.execute(
                text(f'DELETE FROM {table} WHERE value = :value RETURNING *'),
                {'value': value}
            )
            if not result.first():
                raise NotFoundError('Value not found')
            
            result = conn.execute(text(f'SELECT value FROM {table} ORDER BY order_index ASC'))
            values = [row['value'] for row in result]
    else:
        data = read_csv(file_path)
        new_data = [row for row in data if row['value'] != value]
        
        if len(new_data) == len(data):
            raise NotFoundError('Value not found')
            
        write_csv(file_path, new_data)
        values = [row['value'] for row in sorted(new_data, key=lambda x: x.get('order_index', 0))]

    return jsonify(values)

@app.route('/dropdowns/<key>/reorder', methods=['PUT'])
@async_handler
def reorder_dropdown_values(key):
    values = request.json.get('values', [])
    
    if key in ['origin_country', 'main_impact_country']:
        table = 'countries'
        file_path = Config.CSV['countries_path']
    elif key == 'relevant_exchange':
        table = 'exchanges'
        file_path = Config.CSV['exchanges_path']
    elif key == 'event_type':
        table = 'event_types'
        file_path = Config.CSV['event_types_path']
    else:
        raise ValidationError('Invalid dropdown key')

    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            # Start transaction
            trans = conn.begin()
            try:
                for i, value in enumerate(values):
                    conn.execute(
                        text(f'UPDATE {table} SET order_index = :order_index WHERE value = :value'),
                        {'order_index': i, 'value': value}
                    )
                trans.commit()
            except:
                trans.rollback()
                raise
    else:
        data = read_csv(file_path)
        new_data = [{'value': value, 'order_index': i} for i, value in enumerate(values)]
        write_csv(file_path, new_data)

    return jsonify(values)

@app.route('/events', methods=['POST'])
@async_handler
def create_event():
    data = request.json
    required_fields = ['event_name', 'event_type', 'origin_country', 'main_impact_country',
                      'relevant_exchange', 'month', 'year', 'description']
    
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")

    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO events 
                    (event_name, event_type, origin_country, main_impact_country,
                     relevant_exchange, month, year, description, created_at)
                    VALUES (:event_name, :event_type, :origin_country, :main_impact_country,
                            :relevant_exchange, :month, :year, :description, :created_at)
                    RETURNING *
                """),
                {**data, 'created_at': datetime.utcnow()}
            )
            event = dict(result.first())
        return jsonify(event)
    else:
        events = read_csv(Config.CSV['events_path'])
        new_event = {
            'id': len(events) + 1,
            **data,
            'created_at': datetime.utcnow().isoformat()
        }
        events.append(new_event)
        write_csv(Config.CSV['events_path'], events)
        return jsonify(new_event)

@app.route('/events', methods=['GET'])
@async_handler
def get_events():
    if Config.STORAGE_TYPE in ['postgres', 'sqlite']:
        db = get_db()
        with db.connect() as conn:
            result = conn.execute(text('SELECT * FROM events ORDER BY created_at DESC'))
            events = [dict(row) for row in result]
        return jsonify(events)
    else:
        events = read_csv(Config.CSV['events_path'])
        events.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify(events)

@app.route('/')
def index():
    """Display API documentation."""
    docs = f"""
    <html>
        <head><title>Python API Server Documentation</title></head>
        <body>
            <h1>Python API Server Documentation</h1>
            <h2>Available Endpoints:</h2>
            <ul>
                <li><strong>GET /</strong> - This API documentation</li>
                <li><strong>GET /entries</strong> - Retrieve all entries</li>
                <li><strong>POST /entries</strong> - Create a new entry</li>
                <li><strong>PUT /entries/:id</strong> - Update an entry by id</li>
                <li><strong>DELETE /entries/:id</strong> - Delete an entry by id</li>
                <li><strong>GET /dropdowns</strong> - Retrieve all dropdown lists</li>
                <li><strong>POST /dropdowns/:key</strong> - Add a new dropdown value for a given key</li>
                <li><strong>DELETE /dropdowns/:key</strong> - Remove a dropdown value for a given key</li>
                <li><strong>PUT /dropdowns/:key/reorder</strong> - Reorder dropdown values for a given key</li>
                <li><strong>POST /events</strong> - Create a new event</li>
                <li><strong>GET /events</strong> - Retrieve all events</li>
            </ul>
            <p>CSV File paths used:</p>
            <ul>
                <li>Data: {Config.CSV['data_path']}</li>
                <li>Countries: {Config.CSV['countries_path']}</li>
                <li>Exchanges: {Config.CSV['exchanges_path']}</li>
                <li>Event Types: {Config.CSV['event_types_path']}</li>
                <li>Events: {Config.CSV['events_path']}</li>
            </ul>
        </body>
    </html>
    """
    return docs

# Register error handler
app.register_error_handler(Exception, handle_error)

# Cleanup database connection on server shutdown
import atexit
atexit.register(close_db)

if __name__ == '__main__':
    # Start the server
    port = 5001
    while True:
        try:
            app.run(host='0.0.0.0', port=port)
            break
        except OSError as e:
            if e.errno == 98:  # Address already in use
                print(f"Port {port} is busy, trying {port + 1}")
                port += 1
            else:
                raise 