import React, { useState, useEffect } from 'react';
import './Conditions.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const Conditions = ({ onDragStart, onDragEnd, componentKey }) => {
  const [conditionList, setConditionList] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm);
        if (savedState.selectedCondition !== undefined) setSelectedCondition(savedState.selectedCondition);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when it changes
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        searchTerm,
        selectedCondition
      });
    }
  }, [componentKey, searchTerm, selectedCondition, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  useEffect(() => {
    fetchConditionList();
  }, []);

  const fetchConditionList = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.dnd5eapi.co/api/conditions');
      if (!response.ok) throw new Error('Failed to fetch conditions');
      const data = await response.json();
      setConditionList(data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConditionDetails = async (index) => {
    try {
      setLoading(true);
      const response = await fetch(`https://www.dnd5eapi.co/api/conditions/${index}`);
      if (!response.ok) throw new Error('Failed to fetch condition details');
      const data = await response.json();
      setSelectedCondition(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConditionSelect = (condition) => {
    fetchConditionDetails(condition.index);
  };

  const handleBackToList = () => {
    setSelectedCondition(null);
    setSearchTerm('');
  };

  const filteredConditions = conditionList.filter(condition => 
    condition.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="conditions">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>💀 D&D 5e Conditions</h3>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {!selectedCondition ? (
        <div className="condition-list-view">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="condition-search"
            />
          </div>

          {loading ? (
            <div className="loading">Loading conditions...</div>
          ) : (
            <div className="condition-list">
              {filteredConditions.map((condition) => (
                <button
                  key={condition.index}
                  className="condition-list-item"
                  onClick={() => handleConditionSelect(condition)}
                >
                  {condition.name}
                </button>
              ))}
              {filteredConditions.length === 0 && (
                <div className="no-results">No conditions found</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="condition-details">
          <button className="back-button" onClick={handleBackToList}>
            ← Back to List
          </button>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <h2 className="condition-name">{selectedCondition.name}</h2>

              {selectedCondition.desc && selectedCondition.desc.length > 0 && (
                <div className="condition-description">
                  {selectedCondition.desc.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Conditions;
