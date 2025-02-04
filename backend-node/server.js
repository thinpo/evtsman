// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const csvParser = require('csv-parser');
const config = require('./config');
const { initializeDB, getPool, closeDB } = require('./db');
const { errorHandler, asyncHandler, NotFoundError, ValidationError } = require('./utils/errors');
const app = express();

app.use(cors());
app.use(express.json());

// Initialize database if using PostgreSQL or SQLite
initializeDB().catch(console.error);

// Define CSV file paths
const DATA_CSV = './data/data.csv';
const COUNTRIES_CSV = './data/countries.csv';
const EXCHANGES_CSV = './data/exchanges.csv';
const EVENTTYPES_CSV = './data/event_types.csv';
const EVENTS_CSV = './data/events.csv';

// Helper function to read a CSV file and return a promise resolving with an array of rows (as objects)
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .on('error', (err) => reject(new Error(`Failed to read CSV file: ${err.message}`)))
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(new Error(`Failed to parse CSV file: ${err.message}`)));
  });
}

// Helper function to write an array of objects to a CSV file
async function writeCSV(filePath, dataArray) {
  try {
    if (dataArray.length === 0) {
      await fs.writeFile(filePath, 'value,order_index\n');
      return;
    }
    const header = 'value,order_index\n';
    const rows = dataArray.map((obj, index) => `${obj.value},${obj.order_index || index}`).join('\n');
    await fs.writeFile(filePath, header + rows);
  } catch (err) {
    throw new Error(`Failed to write CSV file: ${err.message}`);
  }
}

// Endpoints for entries

// GET all entries
app.get('/entries', asyncHandler(async (req, res) => {
  if (config.storageType === 'postgres') {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM entries ORDER BY when_input DESC');
    res.json(result.rows);
  } else {
    const entries = await readCSV(config.csv.dataPath);
    res.json(entries);
  }
}));

// POST a new entry
app.post('/entries', asyncHandler(async (req, res) => {
  const requiredFields = ['date', 'month', 'origin_country', 'main_impact_country', 
                         'relevant_exchange', 'event_type', 'who_input', 'when_input', 'details'];
  
  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const newEntry = {
    id: String(Date.now()),
    ...req.body
  };

  if (config.storageType === 'postgres') {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO entries 
       (id, date, month, origin_country, main_impact_country, relevant_exchange, 
        event_type, who_input, when_input, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      Object.values(newEntry)
    );
    res.json(result.rows[0]);
  } else {
    const entries = await readCSV(config.csv.dataPath);
    entries.push(newEntry);
    await writeCSV(config.csv.dataPath, entries);
    res.json(newEntry);
  }
}));

// PUT update an entry
app.put('/entries/:id', asyncHandler(async (req, res) => {
  const entryId = req.params.id;
  
  if (config.storageType === 'postgres') {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE entries 
       SET date = $1, month = $2, origin_country = $3, main_impact_country = $4,
           relevant_exchange = $5, event_type = $6, who_input = $7, when_input = $8,
           details = $9
       WHERE id = $10
       RETURNING *`,
      [
        req.body.date,
        req.body.month,
        req.body.origin_country,
        req.body.main_impact_country,
        req.body.relevant_exchange,
        req.body.event_type,
        req.body.who_input,
        req.body.when_input,
        req.body.details,
        entryId
      ]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Entry not found');
    }
    res.json(result.rows[0]);
  } else {
    let entries = await readCSV(DATA_CSV);
    let found = false;
    entries = entries.map(entry => {
      if (entry.id === entryId) {
        found = true;
        return { ...entry, ...req.body };
      }
      return entry;
    });
    
    if (!found) {
      throw new NotFoundError('Entry not found');
    }
    
    await writeCSV(DATA_CSV, entries);
    res.json(entries.find(e => e.id === entryId));
  }
}));

// DELETE an entry
app.delete('/entries/:id', asyncHandler(async (req, res) => {
  const entryId = req.params.id;
  
  if (config.storageType === 'postgres') {
    const pool = getPool();
    const result = await pool.query('DELETE FROM entries WHERE id = $1 RETURNING *', [entryId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Entry not found');
    }
    res.json({ success: true });
  } else {
    let entries = await readCSV(DATA_CSV);
    const newEntries = entries.filter(entry => entry.id !== entryId);
    
    if (newEntries.length === entries.length) {
      throw new NotFoundError('Entry not found');
    }
    
    await writeCSV(DATA_CSV, newEntries);
    res.json({ success: true });
  }
}));

// Endpoints for dropdowns

// GET all dropdown lists
app.get('/dropdowns', asyncHandler(async (req, res) => {
  if (config.storageType === 'postgres') {
    const pool = getPool();
    const [countries, exchanges, eventTypes] = await Promise.all([
      pool.query('SELECT value FROM countries ORDER BY order_index ASC'),
      pool.query('SELECT value FROM exchanges ORDER BY order_index ASC'),
      pool.query('SELECT value FROM event_types ORDER BY order_index ASC')
    ]);
    
    res.json({
      origin_country: countries.rows.map(row => row.value),
      main_impact_country: countries.rows.map(row => row.value),
      relevant_exchange: exchanges.rows.map(row => row.value),
      event_type: eventTypes.rows.map(row => row.value)
    });
  } else {
    const [countriesData, exchangesData, eventTypesData] = await Promise.all([
      readCSV(config.csv.countriesPath),
      readCSV(config.csv.exchangesPath),
      readCSV(config.csv.eventTypesPath)
    ]);
    
    // Sort by order_index before mapping to values
    const sortByOrder = (data) => 
      [...data].sort((a, b) => (parseInt(a.order_index) || 0) - (parseInt(b.order_index) || 0));
    
    res.json({
      origin_country: sortByOrder(countriesData).map(row => row.value),
      main_impact_country: sortByOrder(countriesData).map(row => row.value),
      relevant_exchange: sortByOrder(exchangesData).map(row => row.value),
      event_type: sortByOrder(eventTypesData).map(row => row.value)
    });
  }
}));

// POST to add a new dropdown value
app.post('/dropdowns/:key', asyncHandler(async (req, res) => {
  const key = req.params.key;
  const { value } = req.body;
  
  if (config.storageType === 'postgres') {
    const pool = getPool();
    let table;
    
    switch (key) {
      case 'origin_country':
      case 'main_impact_country':
        table = 'countries';
        break;
      case 'relevant_exchange':
        table = 'exchanges';
        break;
      case 'event_type':
        table = 'event_types';
        break;
      default:
        throw new ValidationError('Invalid dropdown key');
    }
    
    // Get the maximum order_index
    const maxOrderResult = await pool.query(`SELECT COALESCE(MAX(order_index), -1) as max_order FROM ${table}`);
    const nextOrder = maxOrderResult.rows[0].max_order + 1;
    
    await pool.query(
      `INSERT INTO ${table} (value, order_index) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [value, nextOrder]
    );
    const result = await pool.query(`SELECT value FROM ${table} ORDER BY order_index ASC`);
    res.json(result.rows.map(row => row.value));
  } else {
    let filePath;
    switch (key) {
      case 'origin_country':
      case 'main_impact_country':
        filePath = config.csv.countriesPath;
        break;
      case 'relevant_exchange':
        filePath = config.csv.exchangesPath;
        break;
      case 'event_type':
        filePath = config.csv.eventTypesPath;
        break;
      default:
        throw new ValidationError('Invalid dropdown key');
    }
    
    const data = await readCSV(filePath);
    const existing = data.map(row => row.value);
    
    if (!existing.includes(value)) {
      // Get max order_index
      const maxOrder = Math.max(-1, ...data.map(row => parseInt(row.order_index) || 0));
      const newRow = `${value},${maxOrder + 1}\n`;
      await fs.appendFile(filePath, newRow);
      
      // Read and sort the updated data
      const updatedData = await readCSV(filePath);
      res.json(updatedData.sort((a, b) => 
        (parseInt(a.order_index) || 0) - (parseInt(b.order_index) || 0)
      ).map(row => row.value));
    } else {
      res.json(existing);
    }
  }
}));

// DELETE a dropdown value
app.delete('/dropdowns/:key', asyncHandler(async (req, res) => {
  const key = req.params.key;
  const { value } = req.body;
  
  if (config.storageType === 'postgres') {
    const pool = getPool();
    let table;
    
    switch (key) {
      case 'origin_country':
      case 'main_impact_country':
        table = 'countries';
        break;
      case 'relevant_exchange':
        table = 'exchanges';
        break;
      case 'event_type':
        table = 'event_types';
        break;
      default:
        throw new ValidationError('Invalid dropdown key');
    }
    
    const result = await pool.query(`DELETE FROM ${table} WHERE value = $1 RETURNING *`, [value]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Value not found');
    }
    
    const remaining = await pool.query(`SELECT value FROM ${table}`);
    res.json(remaining.rows.map(row => row.value));
  } else {
    let filePath;
    if (key === 'origin_country' || key === 'main_impact_country') {
      filePath = COUNTRIES_CSV;
    } else if (key === 'relevant_exchange') {
      filePath = EXCHANGES_CSV;
    } else if (key === 'event_type') {
      filePath = EVENTTYPES_CSV;
    } else {
      throw new ValidationError('Invalid dropdown key');
    }
    
    const data = await readCSV(filePath);
    const newValues = data.filter(row => row.value !== value);
    
    if (newValues.length === data.length) {
      throw new NotFoundError('Value not found');
    }
    
    await writeCSV(filePath, newValues);
    res.json(newValues.map(row => row.value));
  }
}));

// PUT to reorder dropdown values
app.put('/dropdowns/:key/reorder', asyncHandler(async (req, res) => {
  const key = req.params.key;
  const { values } = req.body;
  
  if (config.storageType === 'postgres') {
    const pool = getPool();
    let table;
    
    switch (key) {
      case 'origin_country':
      case 'main_impact_country':
        table = 'countries';
        break;
      case 'relevant_exchange':
        table = 'exchanges';
        break;
      case 'event_type':
        table = 'event_types';
        break;
      default:
        throw new ValidationError('Invalid dropdown key');
    }
    
    // Start a transaction to ensure atomicity
    await pool.query('BEGIN');
    
    try {
      // Update order_index for each value
      for (let i = 0; i < values.length; i++) {
        await pool.query(
          `UPDATE ${table} SET order_index = $1 WHERE value = $2`,
          [i, values[i]]
        );
      }
      
      await pool.query('COMMIT');
      res.json(values);
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } else {
    let filePath;
    if (key === 'origin_country' || key === 'main_impact_country') {
      filePath = config.csv.countriesPath;
    } else if (key === 'relevant_exchange') {
      filePath = config.csv.exchangesPath;
    } else if (key === 'event_type') {
      filePath = config.csv.eventTypesPath;
    } else {
      throw new ValidationError('Invalid dropdown key');
    }
    
    // Create array of objects with new order
    const orderedData = values.map((value, index) => ({
      value,
      order_index: index
    }));
    
    // Write the reordered values to CSV
    await writeCSV(filePath, orderedData);
    res.json(values);
  }
}));

// POST to create a new event
app.post('/events', asyncHandler(async (req, res) => {
  const { event_name, event_type, origin_country, main_impact_country, relevant_exchange, month, year, description } = req.body;
  
  if (config.storageType === 'postgres') {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO events (event_name, event_type, origin_country, main_impact_country, relevant_exchange, month, year, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [event_name, event_type, origin_country, main_impact_country, relevant_exchange, month, year, description]
    );
    res.json(result.rows[0]);
  } else {
    const events = await readCSV(config.csv.eventsPath);
    const newEvent = {
      id: events.length > 0 ? Math.max(...events.map(e => parseInt(e.id))) + 1 : 1,
      event_name,
      event_type,
      origin_country,
      main_impact_country,
      relevant_exchange,
      month,
      year,
      description,
      created_at: new Date().toISOString()
    };
    
    const header = 'id,event_name,event_type,origin_country,main_impact_country,relevant_exchange,month,year,description,created_at\n';
    const row = `${newEvent.id},"${newEvent.event_name}","${newEvent.event_type}","${newEvent.origin_country}","${newEvent.main_impact_country}","${newEvent.relevant_exchange}","${newEvent.month}","${newEvent.year}","${newEvent.description}","${newEvent.created_at}"\n`;
    
    if (events.length === 0) {
      await fs.writeFile(config.csv.eventsPath, header + row);
    } else {
      await fs.appendFile(config.csv.eventsPath, row);
    }
    
    res.json(newEvent);
  }
}));

// GET all events
app.get('/events', asyncHandler(async (req, res) => {
  if (config.storageType === 'postgres') {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(result.rows);
  } else {
    const events = await readCSV(config.csv.eventsPath);
    res.json(events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
}));

// Error handling middleware
app.use(errorHandler);

// Cleanup database connection on server shutdown
process.on('SIGINT', async () => {
  try {
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Display API documentation at the root endpoint
app.get('/', (req, res) => {
  res.send(`
<html>
  <head><title>CSV API Server Documentation</title></head>
  <body>
    <h1>CSV API Server Documentation</h1>
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
      <li>Data: ${DATA_CSV}</li>
      <li>Countries: ${COUNTRIES_CSV}</li>
      <li>Exchanges: ${EXCHANGES_CSV}</li>
      <li>Event Types: ${EVENTTYPES_CSV}</li>
    </ul>
  </body>
</html>
  `);
});

// Start the server
const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server failed to start:', err);
    }
  });
};

startServer(5001); 