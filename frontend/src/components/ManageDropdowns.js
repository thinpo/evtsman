import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function ManageDropdowns() {
  const [dropdowns, setDropdowns] = useState({
    origin_country: [],
    relevant_exchange: [],
    event_type: []
  });
  const [newValues, setNewValues] = useState({
    origin_country: '',
    relevant_exchange: '',
    event_type: ''
  });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get('http://localhost:5001/dropdowns');
      // Transform the response data to extract just the values
      const transformedData = {
        origin_country: res.data.origin_country.map(item => item.value),
        relevant_exchange: res.data.relevant_exchange.map(item => item.value),
        event_type: res.data.event_type.map(item => item.value)
      };
      setDropdowns(transformedData);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const handleAdd = async (key) => {
    try {
      if (!newValues[key].trim()) return;
      await axios.post(`http://localhost:5001/dropdowns/${key}`, { value: newValues[key] });
      fetchDropdowns();
      setNewValues(prev => ({ ...prev, [key]: '' }));
    } catch (error) {
      console.error(`Error adding ${key}:`, error);
    }
  };

  const handleDelete = async (key, value) => {
    try {
      await axios.delete(`http://localhost:5001/dropdowns/${key}`, { data: { value } });
      fetchDropdowns();
    } catch (error) {
      console.error(`Error deleting ${key}:`, error);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    const key = source.droppableId;
    const items = Array.from(dropdowns[key]);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    // Update local state immediately for smooth UI
    setDropdowns(prev => ({
      ...prev,
      [key]: items
    }));

    // Update backend
    try {
      await axios.put(`http://localhost:5001/dropdowns/${key}/reorder`, {
        values: items.map(value => ({ value, order_index: items.indexOf(value) }))
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      // Revert to previous state if update fails
      fetchDropdowns();
    }
  };

  const renderSection = (title, key) => (
    <div className="dropdown-section">
      <h3>{title}</h3>
      <div className="dropdown-add">
        <input
          type="text"
          value={newValues[key]}
          onChange={(e) => setNewValues(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={`Add new ${title.toLowerCase()}`}
        />
        <button 
          className="add-button"
          onClick={() => handleAdd(key)}
        >
          Add
        </button>
      </div>
      <Droppable droppableId={key}>
        {(provided) => (
          <div
            className="dropdown-list"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {dropdowns[key]?.map((value, index) => (
              <Draggable
                key={value}
                draggableId={value}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    className={`dropdown-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <div className="item-content">
                      <div {...provided.dragHandleProps} className="drag-handle">
                        ⋮⋮
                      </div>
                      <span>{value}</span>
                    </div>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(key, value)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="manage-dropdowns">
        <h2>Manage Lists</h2>
        {renderSection('Countries', 'origin_country')}
        {renderSection('Exchanges', 'relevant_exchange')}
        {renderSection('Event Types', 'event_type')}
      </div>
    </DragDropContext>
  );
}

export default ManageDropdowns; 