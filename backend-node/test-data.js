const axios = require('axios');

const testEntries = [
  {
    date: '2024-02-15',
    month: 'February',
    origin_country: 'USA',
    main_impact_country: 'China',
    relevant_exchange: 'NYSE',
    event_type: 'Market Expansion',
    who_input: 'Test User',
    when_input: '2024-02-15T10:30:00',
    details: 'Major US tech company announces significant expansion into Chinese market, establishing new R&D centers in Shanghai and Beijing.'
  },
  {
    date: '2024-01-20',
    month: 'January',
    origin_country: 'Japan',
    main_impact_country: 'USA',
    relevant_exchange: 'TSE',
    event_type: 'Merger',
    who_input: 'Test User',
    when_input: '2024-01-20T14:15:00',
    details: 'Japanese automotive giant merges with US electric vehicle startup to accelerate EV development and market presence.'
  },
  {
    date: '2024-03-05',
    month: 'March',
    origin_country: 'Germany',
    main_impact_country: 'UK',
    relevant_exchange: 'LSE',
    event_type: 'Acquisition',
    who_input: 'Test User',
    when_input: '2024-03-05T09:45:00',
    details: 'German industrial conglomerate acquires British renewable energy company for €2.5 billion.'
  },
  {
    date: '2024-02-28',
    month: 'February',
    origin_country: 'China',
    main_impact_country: 'India',
    relevant_exchange: 'HKEX',
    event_type: 'IPO',
    who_input: 'Test User',
    when_input: '2024-02-28T11:20:00',
    details: 'Major Chinese e-commerce platform specializing in India-China trade launches IPO on HKEX.'
  },
  {
    date: '2024-01-10',
    month: 'January',
    origin_country: 'USA',
    main_impact_country: 'USA',
    relevant_exchange: 'NASDAQ',
    event_type: 'Regulatory Action',
    who_input: 'Test User',
    when_input: '2024-01-10T16:00:00',
    details: 'SEC announces new cybersecurity disclosure requirements for publicly traded companies.'
  },
  {
    date: '2024-03-01',
    month: 'March',
    origin_country: 'UK',
    main_impact_country: 'Germany',
    relevant_exchange: 'LSE',
    event_type: 'Restructuring',
    who_input: 'Test User',
    when_input: '2024-03-01T13:30:00',
    details: 'British multinational bank announces major restructuring, affecting operations in Germany and other EU countries.'
  },
  {
    date: '2024-02-01',
    month: 'February',
    origin_country: 'India',
    main_impact_country: 'Japan',
    relevant_exchange: 'TSE',
    event_type: 'Management Change',
    who_input: 'Test User',
    when_input: '2024-02-01T08:15:00',
    details: 'Indian tech services giant appoints new CEO with extensive experience in Japanese market.'
  },
  {
    date: '2024-01-15',
    month: 'January',
    origin_country: 'Russia',
    main_impact_country: 'Brazil',
    relevant_exchange: 'NYSE',
    event_type: 'Market Expansion',
    who_input: 'Test User',
    when_input: '2024-01-15T12:45:00',
    details: 'Russian agricultural company expands operations to Brazil, announcing major investment in local infrastructure.'
  }
];

async function addTestEntries() {
  try {
    for (const entry of testEntries) {
      await axios.post('http://localhost:5001/entries', entry);
      console.log(`Added entry: ${entry.event_type} - ${entry.date}`);
    }
    console.log('All test entries added successfully!');
  } catch (error) {
    console.error('Error adding test entries:', error.message);
  }
}

// Run the function
addTestEntries(); 