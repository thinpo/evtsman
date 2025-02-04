CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) REFERENCES event_types(value),
  origin_country VARCHAR(100) REFERENCES countries(value),
  main_impact_country VARCHAR(100) REFERENCES countries(value),
  relevant_exchange VARCHAR(100) REFERENCES exchanges(value),
  month VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 