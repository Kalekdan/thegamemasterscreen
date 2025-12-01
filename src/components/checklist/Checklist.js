import React, { useState, useEffect } from 'react';
import './Checklist.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const Checklist = ({ onDragStart, onDragEnd, componentKey }) => {
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.items !== undefined) setItems(savedState.items);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when items change
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, { items });
    }
  }, [componentKey, items, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  const addItem = () => {
    if (newItemText.trim()) {
      setItems([...items, {
        id: Date.now(),
        text: newItemText.trim(),
        completed: false
      }]);
      setNewItemText('');
    }
  };

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearCompleted = () => {
    setItems(items.filter(item => !item.completed));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  const completedCount = items.filter(item => item.completed).length;

  return (
    <div className="checklist">
      <div
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
      >
        ⋮⋮
      </div>
      <h3>✓ Checklist</h3>
      
      <div className="checklist-add">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add new item..."
          className="checklist-input"
        />
        <button onClick={addItem} className="add-item-btn">
          ➕
        </button>
      </div>

      <div className="checklist-stats">
        {items.length > 0 && (
          <span>{completedCount} / {items.length} completed</span>
        )}
      </div>

      <div className="checklist-items">
        {items.length === 0 ? (
          <div className="empty-message">No items yet. Add one above!</div>
        ) : (
          items.map(item => (
            <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleItem(item.id)}
                className="checklist-checkbox"
              />
              <span className="checklist-text" onClick={() => toggleItem(item.id)}>
                {item.text}
              </span>
              <button 
                onClick={() => deleteItem(item.id)} 
                className="delete-item-btn"
                title="Delete item"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && completedCount > 0 && (
        <button onClick={clearCompleted} className="clear-completed-btn">
          Clear Completed
        </button>
      )}
    </div>
  );
};

export default Checklist;
