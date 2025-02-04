import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import SearchBar from './components/SearchBar';
import ManageDropdowns from './components/ManageDropdowns';
import './styles.css';

function App() {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' or 'manage'

  // Add escape key handler
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowForm(false);
        setEditingEntry(null);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Fetch entries from backend
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const res = await axios.get('http://localhost:5001/entries');
    setEntries(res.data);
  };

  const addEntry = async (entry) => {
    const res = await axios.post('http://localhost:5001/entries', entry);
    setEntries([...entries, res.data]);
    setShowForm(false);
  };

  const updateEntry = async (entry) => {
    if (!editingEntry) {
      // If not currently editing, set the entry to edit and show form
      setEditingEntry(entry);
      setShowForm(true);
    } else {
      try {
        // If already editing (form is open), make the update request
        const res = await axios.put(`http://localhost:5001/entries/${entry.id}`, entry);
        setEntries(entries.map(e => e.id === entry.id ? res.data : e));
        setShowForm(false);
        setEditingEntry(null);
      } catch (error) {
        console.error('Error updating entry:', error);
      }
    }
  };

  const deleteEntry = async (id) => {
    await axios.delete(`http://localhost:5001/entries/${id}`);
    setEntries(entries.filter(entry => entry.id !== id));
  };

  // Basic search/filter functionality
  const filteredEntries = entries.filter(entry =>
    Object.values(entry).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Event Manager</h1>
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'entries' ? 'active' : ''}`}
            onClick={() => setActiveTab('entries')}
          >
            Entries
          </button>
          <button 
            className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Lists
          </button>
        </div>
        {activeTab === 'entries' && (
          <div className="header-controls">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <button 
              className="add-button"
              onClick={() => {
                setEditingEntry(null);
                setShowForm(!showForm);
              }}
            >
              {showForm ? 'Cancel' : '+ Add New Entry'}
            </button>
          </div>
        )}
      </header>
      
      <main className="app-main">
        {activeTab === 'entries' ? (
          <>
            {showForm && (
              <div className="form-overlay" onClick={(e) => {
                if (e.target.className === 'form-overlay') {
                  setShowForm(false);
                  setEditingEntry(null);
                }
              }}>
                <div className="form-container">
                  <button 
                    className="close-button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                    }}
                  >
                    ×
                  </button>
                  <EntryForm 
                    addEntry={addEntry} 
                    updateEntry={updateEntry}
                    editingEntry={editingEntry}
                  />
                </div>
              </div>
            )}
            <EntryList 
              entries={filteredEntries} 
              updateEntry={updateEntry} 
              deleteEntry={deleteEntry}
            />
          </>
        ) : (
          <ManageDropdowns />
        )}
      </main>
    </div>
  );
}

export default App; 