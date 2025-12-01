import React, { useState, useEffect } from 'react';
import './MagicItems.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const MagicItems = ({ onDragStart, onDragEnd, setGlobalDiceResult, componentKey }) => {
  const [itemList, setItemList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
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
        if (savedState.selectedItem !== undefined) setSelectedItem(savedState.selectedItem);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when it changes
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        searchTerm,
        selectedItem
      });
    }
  }, [componentKey, searchTerm, selectedItem, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  useEffect(() => {
    fetchItemList();
  }, []);

  const fetchItemList = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.dnd5eapi.co/api/magic-items');
      if (!response.ok) throw new Error('Failed to fetch magic items');
      const data = await response.json();
      setItemList(data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (index) => {
    try {
      setLoading(true);
      const response = await fetch(`https://www.dnd5eapi.co/api/magic-items/${index}`);
      if (!response.ok) throw new Error('Failed to fetch item details');
      const data = await response.json();
      setSelectedItem(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item) => {
    fetchItemDetails(item.index);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setSearchTerm('');
  };

  const rollDice = (diceString) => {
    const match = diceString.match(/(\d+)d(\d+)([+-]\d+)?/i);
    if (!match) return null;

    const numDice = parseInt(match[1]);
    const diceSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    let rolls = [];
    let total = modifier;

    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * diceSize) + 1;
      rolls.push(roll);
      total += roll;
    }

    return {
      formula: diceString,
      rolls,
      modifier,
      total
    };
  };

  const handleDiceClick = (diceString) => {
    const result = rollDice(diceString);
    if (result && setGlobalDiceResult) {
      setGlobalDiceResult(result);
    }
  };

  const renderTextWithDiceRolls = (text) => {
    if (!text) return text;
    
    const dicePattern = /(\d+d\d+(?:\s*[+-]\s*\d+)?|[+-]\d+)/gi;
    const parts = text.split(dicePattern);
    
    return parts.map((part, index) => {
      const isDiceRoll = part.match(/\d+d\d+(?:\s*[+-]\s*\d+)?/i);
      const isModifier = part.match(/^[+-]\d+$/);
      
      if (isDiceRoll || isModifier) {
        const rollFormula = isModifier ? `1d20${part}` : part;
        const displayText = part;
        
        return (
          <span
            key={index}
            className="dice-roll-link"
            onClick={(e) => {
              e.stopPropagation();
              handleDiceClick(rollFormula);
            }}
            title={`Click to roll ${isModifier ? 'd20' : ''}${part}`}
          >
            {displayText}
          </span>
        );
      }
      return part;
    });
  };

  const filteredItems = itemList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="magic-items">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>✨ D&D 5e Magic Items</h3>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {!selectedItem ? (
        <div className="item-list-view">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search magic items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="item-search"
            />
          </div>

          {loading ? (
            <div className="loading">Loading magic items...</div>
          ) : (
            <div className="item-list">
              {filteredItems.map((item) => (
                <button
                  key={item.index}
                  className="item-list-item"
                  onClick={() => handleItemSelect(item)}
                >
                  {item.name}
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="no-results">No magic items found</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="item-details">
          <button className="back-button" onClick={handleBackToList}>
            ← Back to List
          </button>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <h2 className="item-name">{selectedItem.name}</h2>
              
              <div className="item-subtitle">
                {selectedItem.equipment_category?.name && (
                  <span>{selectedItem.equipment_category.name}</span>
                )}
                {selectedItem.rarity?.name && (
                  <span> • {selectedItem.rarity.name}</span>
                )}
              </div>

              {selectedItem.desc && selectedItem.desc.length > 0 && (
                <div className="item-description">
                  {selectedItem.desc.map((paragraph, idx) => (
                    <p key={idx}>{renderTextWithDiceRolls(paragraph)}</p>
                  ))}
                </div>
              )}

              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div className="item-variants">
                  <h4>Variants</h4>
                  <ul>
                    {selectedItem.variants.map((variant, idx) => (
                      <li key={idx}>{variant.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MagicItems;
