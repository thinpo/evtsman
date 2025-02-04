import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function EntryForm({ addEntry, updateEntry, editingEntry }) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  const [entry, setEntry] = useState({
    date: today,
    month: currentMonth,
    origin_country: '',
    main_impact_country: '',
    relevant_exchange: '',
    event_type: '',
    who_input: '',
    when_input: new Date().toISOString().slice(0, 16),
    details: ''
  });

  const [dropdowns, setDropdowns] = useState({
    origin_country: [],
    main_impact_country: [],
    relevant_exchange: [],
    event_type: []
  });

  // Set form data when editing an entry
  useEffect(() => {
    if (editingEntry) {
      setEntry({
        ...editingEntry,
        when_input: new Date(editingEntry.when_input).toISOString().slice(0, 16)
      });
    }
  }, [editingEntry]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      const res = await axios.get('http://localhost:5001/dropdowns');
      setDropdowns(res.data);
    };
    fetchDropdowns();
  }, []);

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEntry) {
      updateEntry(entry);
    } else {
      addEntry(entry);
    }
    // Reset form to defaults
    setEntry({
      date: today,
      month: currentMonth,
      origin_country: '',
      main_impact_country: '',
      relevant_exchange: '',
      event_type: '',
      who_input: '',
      when_input: new Date().toISOString().slice(0, 16),
      details: ''
    });
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h2>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</h2>
      
      <div className="form-group">
        <label>Date:</label>
        <input 
          type="date" 
          name="date" 
          value={entry.date} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label>Month:</label>
        <select 
          name="month" 
          value={entry.month} 
          onChange={handleChange} 
          required
        >
          <option value="">Select Month</option>
          {MONTHS.map((month, index) => (
            <option key={index} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Origin Country:</label>
        <select 
          name="origin_country" 
          value={entry.origin_country} 
          onChange={handleChange} 
          required
        >
          <option value="">Select Origin Country</option>
          {dropdowns.origin_country?.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Main Impact Country:</label>
        <select 
          name="main_impact_country" 
          value={entry.main_impact_country} 
          onChange={handleChange} 
          required
        >
          <option value="">Select Impact Country</option>
          {dropdowns.main_impact_country?.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Relevant Exchange:</label>
        <select 
          name="relevant_exchange" 
          value={entry.relevant_exchange} 
          onChange={handleChange} 
          required
        >
          <option value="">Select Exchange</option>
          {dropdowns.relevant_exchange?.map((exchange, index) => (
            <option key={index} value={exchange}>{exchange}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Event Type:</label>
        <select 
          name="event_type" 
          value={entry.event_type} 
          onChange={handleChange} 
          required
        >
          <option value="">Select Event Type</option>
          {dropdowns.event_type?.map((evt, index) => (
            <option key={index} value={evt}>{evt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Who Input:</label>
        <input 
          type="text" 
          name="who_input" 
          value={entry.who_input} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label>When Input:</label>
        <input 
          type="datetime-local" 
          name="when_input" 
          value={entry.when_input} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label>Details:</label>
        <textarea 
          name="details" 
          value={entry.details} 
          onChange={handleChange} 
          required
        ></textarea>
      </div>

      <button type="submit" className="add-button">
        {editingEntry ? 'Save Changes' : 'Add Entry'}
      </button>
    </form>
  );
}

export default EntryForm; 