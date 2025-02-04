import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './EventForm.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EventForm = ({ dropdowns, onSubmit }) => {
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: '',
    origin_country: '',
    main_impact_country: '',
    relevant_exchange: '',
    month: '',
    year: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <div className="form-group">
        <label htmlFor="event_name">Event Name:</label>
        <input
          type="text"
          id="event_name"
          name="event_name"
          value={formData.event_name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="event_type">Event Type:</label>
        <select
          id="event_type"
          name="event_type"
          value={formData.event_type}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Event Type</option>
          {dropdowns.event_type?.map((type, index) => (
            <option key={index} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="origin_country">Origin Country:</label>
        <select
          id="origin_country"
          name="origin_country"
          value={formData.origin_country}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Origin Country</option>
          {dropdowns.origin_country?.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="main_impact_country">Main Impact Country:</label>
        <select
          id="main_impact_country"
          name="main_impact_country"
          value={formData.main_impact_country}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Main Impact Country</option>
          {dropdowns.main_impact_country?.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="relevant_exchange">Relevant Exchange:</label>
        <select
          id="relevant_exchange"
          name="relevant_exchange"
          value={formData.relevant_exchange}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Relevant Exchange</option>
          {dropdowns.relevant_exchange?.map((exchange, index) => (
            <option key={index} value={exchange}>{exchange}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="month">Month:</label>
        <select
          id="month"
          name="month"
          value={formData.month}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Month</option>
          {MONTHS.map((month, index) => (
            <option key={index} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="year">Year:</label>
        <input
          type="number"
          id="year"
          name="year"
          value={formData.year}
          onChange={handleInputChange}
          required
          min="1900"
          max="2100"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </div>

      <button type="submit" className="submit-button">Submit</button>
    </form>
  );
};

EventForm.propTypes = {
  dropdowns: PropTypes.shape({
    event_type: PropTypes.arrayOf(PropTypes.string),
    origin_country: PropTypes.arrayOf(PropTypes.string),
    main_impact_country: PropTypes.arrayOf(PropTypes.string),
    relevant_exchange: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default EventForm; 