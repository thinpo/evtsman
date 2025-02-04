import React, { useState, useCallback, useRef, useEffect } from 'react';

function EntryList({ entries, updateEntry, deleteEntry }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [currentResizer, setCurrentResizer] = useState(null);
  const [columnWidths, setColumnWidths] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const tableRef = useRef(null);
  const startXRef = useRef(null);
  const startWidthRef = useRef(null);

  const columns = [
    { id: 'date', label: 'Date', minWidth: 120, sortable: true },
    { id: 'month', label: 'Month', minWidth: 100, sortable: true },
    { id: 'origin_country', label: 'Origin Country', minWidth: 130, sortable: true },
    { id: 'main_impact_country', label: 'Impact Country', minWidth: 130, sortable: true },
    { id: 'relevant_exchange', label: 'Exchange', minWidth: 110, sortable: true },
    { id: 'event_type', label: 'Event Type', minWidth: 130, sortable: true },
    { id: 'who_input', label: 'Who Input', minWidth: 120, sortable: true },
    { id: 'when_input', label: 'When Input', minWidth: 180, sortable: true },
    { id: 'details', label: 'Details', minWidth: 250, sortable: true },
    { id: 'actions', label: 'Actions', minWidth: 140, sortable: false }
  ];

  useEffect(() => {
    // Initialize column widths
    const initialWidths = {};
    columns.forEach(col => {
      initialWidths[col.id] = col.minWidth;
    });
    setColumnWidths(initialWidths);
  }, []);

  const handleResizeStart = useCallback((e, columnId) => {
    e.preventDefault();
    setIsResizing(true);
    setCurrentResizer(columnId);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[columnId] || 0;
    document.body.classList.add('table-resizing');
  }, [columnWidths]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !currentResizer) return;

    const diff = e.clientX - startXRef.current;
    const newWidth = Math.max(
      columns.find(col => col.id === currentResizer).minWidth,
      startWidthRef.current + diff
    );

    setColumnWidths(prev => ({
      ...prev,
      [currentResizer]: newWidth
    }));
  }, [isResizing, currentResizer, columns]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setCurrentResizer(null);
    document.body.classList.remove('table-resizing');
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleDelete = (e, entryId) => {
    e.stopPropagation();
    setDeleteConfirm(entryId);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    if (deleteConfirm) {
      deleteEntry(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  const handleTooltipPosition = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Calculate position to show tooltip below the cell
    const tooltipTop = rect.bottom + scrollY;
    const tooltipLeft = rect.left + scrollX;
    
    setTooltipStyle({
      top: `${tooltipTop}px`,
      left: `${tooltipLeft}px`
    });
  }, []);

  const handleSort = (columnId) => {
    let direction = 'asc';
    if (sortConfig.key === columnId && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnId, direction });
  };

  const handleFilterClick = (e, columnId) => {
    e.stopPropagation(); // Prevent sort
    setActiveFilter(activeFilter === columnId ? null : columnId);
    setFilterSearch('');
  };

  const getUniqueValues = (columnId) => {
    const values = new Set();
    entries.forEach(entry => {
      if (entry[columnId] !== undefined && entry[columnId] !== null) {
        values.add(String(entry[columnId]));
      }
    });
    return Array.from(values).sort();
  };

  const handleFilterChange = (value, checked) => {
    setFilterValues(prev => {
      const current = prev[activeFilter] || new Set();
      const updated = new Set(current);
      if (checked) {
        updated.add(value);
      } else {
        updated.delete(value);
      }
      return {
        ...prev,
        [activeFilter]: updated
      };
    });
  };

  const applyFilter = () => {
    setActiveFilter(null);
  };

  const clearFilter = () => {
    setFilterValues(prev => ({
      ...prev,
      [activeFilter]: new Set()
    }));
    setActiveFilter(null);
  };

  const getFilteredEntries = useCallback(() => {
    let result = entries;

    // Apply filters
    Object.entries(filterValues).forEach(([columnId, values]) => {
      if (values.size > 0) {
        result = result.filter(entry => values.has(String(entry[columnId])));
      }
    });

    // Apply sort
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (sortConfig.key === 'when_input') {
          return sortConfig.direction === 'asc'
            ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
            : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
        }

        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [entries, filterValues, sortConfig]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeFilter && !event.target.closest('.filter-dropdown') && 
          !event.target.closest(`th[data-column="${activeFilter}"]`)) {
        setActiveFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFilter]);

  return (
    <div className="entry-list-container">
      <div className="table-responsive">
        <table className="entry-table" ref={tableRef}>
          <thead>
            <tr>
              {columns.map(column => (
                <th 
                  key={column.id}
                  data-column={column.id}
                  style={{ width: columnWidths[column.id] }}
                  className={`
                    ${sortConfig.key === column.id ? `sort-${sortConfig.direction}` : ''}
                    ${filterValues[column.id]?.size > 0 ? 'filtered' : ''}
                  `}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  {column.label}
                  {column.sortable && (
                    <div
                      className="filter-icon"
                      onClick={(e) => handleFilterClick(e, column.id)}
                    />
                  )}
                  <div
                    className={`resize-handle ${currentResizer === column.id ? 'active' : ''}`}
                    onMouseDown={(e) => handleResizeStart(e, column.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {activeFilter === column.id && (
                    <div className="filter-dropdown show">
                      <div className="filter-search">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="filter-options">
                        {getUniqueValues(column.id)
                          .filter(value => 
                            value.toLowerCase().includes(filterSearch.toLowerCase())
                          )
                          .map(value => (
                            <label key={value} className="filter-option">
                              <input
                                type="checkbox"
                                checked={filterValues[column.id]?.has(value) || false}
                                onChange={(e) => handleFilterChange(value, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {value}
                            </label>
                          ))
                        }
                      </div>
                      <div className="filter-actions">
                        <button 
                          className="filter-button"
                          onClick={clearFilter}
                        >
                          Clear
                        </button>
                        <button 
                          className="filter-button apply"
                          onClick={applyFilter}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getFilteredEntries().length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">No entries found.</td>
              </tr>
            ) : (
              getFilteredEntries().map(entry => (
                <tr 
                  key={entry.id} 
                  onDoubleClick={() => updateEntry(entry)}
                  className="entry-row"
                >
                  <td style={{ width: columnWidths.date }}>{entry.date}</td>
                  <td style={{ width: columnWidths.month }}>{entry.month}</td>
                  <td style={{ width: columnWidths.origin_country }}>{entry.origin_country}</td>
                  <td style={{ width: columnWidths.main_impact_country }}>{entry.main_impact_country}</td>
                  <td style={{ width: columnWidths.relevant_exchange }}>{entry.relevant_exchange}</td>
                  <td style={{ width: columnWidths.event_type }}>{entry.event_type}</td>
                  <td style={{ width: columnWidths.who_input }}>{entry.who_input}</td>
                  <td style={{ width: columnWidths.when_input }}>
                    {new Date(entry.when_input).toLocaleString()}
                  </td>
                  <td 
                    className="details-cell"
                    style={{ width: columnWidths.details }}
                  >
                    <div 
                      className="details-content"
                      onMouseEnter={handleTooltipPosition}
                    >
                      {entry.details}
                    </div>
                    <div 
                      className="details-tooltip"
                      style={tooltipStyle}
                    >
                      {entry.details}
                    </div>
                  </td>
                  <td 
                    className="actions-cell"
                    style={{ width: columnWidths.actions }}
                  >
                    <button 
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateEntry(entry);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={(e) => handleDelete(e, entry.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="confirm-overlay" onClick={cancelDelete}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this entry?</p>
            <div className="confirm-actions">
              <button className="cancel-button" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-delete-button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntryList; 