import React, { useState, useEffect } from 'react';
import './Equipment.css';

const Equipment = ({ onDragStart, onDragEnd, setGlobalDiceResult }) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  useEffect(() => {
    fetchEquipmentList();
  }, []);

  const fetchEquipmentList = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.dnd5eapi.co/api/equipment');
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setEquipmentList(data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentDetails = async (index) => {
    try {
      setLoading(true);
      const response = await fetch(`https://www.dnd5eapi.co/api/equipment/${index}`);
      if (!response.ok) throw new Error('Failed to fetch equipment details');
      const data = await response.json();
      setSelectedEquipment(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentSelect = (equipment) => {
    fetchEquipmentDetails(equipment.index);
  };

  const handleBackToList = () => {
    setSelectedEquipment(null);
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

  const filteredEquipment = equipmentList.filter(equipment => 
    equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="equipment">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>⚔️ D&D 5e Equipment</h3>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {!selectedEquipment ? (
        <div className="equipment-list-view">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="equipment-search"
            />
          </div>

          {loading ? (
            <div className="loading">Loading equipment...</div>
          ) : (
            <div className="equipment-list">
              {filteredEquipment.map((equipment) => (
                <button
                  key={equipment.index}
                  className="equipment-list-item"
                  onClick={() => handleEquipmentSelect(equipment)}
                >
                  {equipment.name}
                </button>
              ))}
              {filteredEquipment.length === 0 && (
                <div className="no-results">No equipment found</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="equipment-details">
          <button className="back-button" onClick={handleBackToList}>
            ← Back to List
          </button>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <h2 className="equipment-name">{selectedEquipment.name}</h2>
              
              <div className="equipment-subtitle">
                {selectedEquipment.equipment_category?.name}
              </div>

              <div className="stat-block">
                {selectedEquipment.cost && (
                  <div className="stat-row">
                    <span className="stat-label">Cost</span>
                    <span className="stat-value">
                      {selectedEquipment.cost.quantity} {selectedEquipment.cost.unit}
                    </span>
                  </div>
                )}
                
                {selectedEquipment.weight && (
                  <div className="stat-row">
                    <span className="stat-label">Weight</span>
                    <span className="stat-value">{selectedEquipment.weight} lb</span>
                  </div>
                )}

                {selectedEquipment.armor_class && (
                  <div className="stat-row">
                    <span className="stat-label">Armor Class</span>
                    <span className="stat-value">
                      {selectedEquipment.armor_class.base}
                      {selectedEquipment.armor_class.dex_bonus !== undefined && 
                        ` + Dex modifier${selectedEquipment.armor_class.max_bonus ? ` (max ${selectedEquipment.armor_class.max_bonus})` : ''}`
                      }
                    </span>
                  </div>
                )}

                {selectedEquipment.armor_category && (
                  <div className="stat-row">
                    <span className="stat-label">Armor Type</span>
                    <span className="stat-value">{selectedEquipment.armor_category}</span>
                  </div>
                )}

                {selectedEquipment.str_minimum && (
                  <div className="stat-row">
                    <span className="stat-label">Strength Required</span>
                    <span className="stat-value">{selectedEquipment.str_minimum}</span>
                  </div>
                )}

                {selectedEquipment.stealth_disadvantage && (
                  <div className="stat-row">
                    <span className="stat-label">Stealth</span>
                    <span className="stat-value">Disadvantage</span>
                  </div>
                )}

                {selectedEquipment.damage && (
                  <div className="stat-row">
                    <span className="stat-label">Damage</span>
                    <span className="stat-value">
                      {renderTextWithDiceRolls(selectedEquipment.damage.damage_dice)} {selectedEquipment.damage.damage_type?.name}
                    </span>
                  </div>
                )}

                {selectedEquipment.range && (
                  <div className="stat-row">
                    <span className="stat-label">Range</span>
                    <span className="stat-value">
                      {selectedEquipment.range.normal} ft.
                      {selectedEquipment.range.long && ` / ${selectedEquipment.range.long} ft.`}
                    </span>
                  </div>
                )}

                {selectedEquipment.weapon_category && (
                  <div className="stat-row">
                    <span className="stat-label">Weapon Type</span>
                    <span className="stat-value">{selectedEquipment.weapon_category}</span>
                  </div>
                )}

                {selectedEquipment.weapon_range && (
                  <div className="stat-row">
                    <span className="stat-label">Weapon Range</span>
                    <span className="stat-value">{selectedEquipment.weapon_range}</span>
                  </div>
                )}

                {selectedEquipment.category_range && (
                  <div className="stat-row">
                    <span className="stat-label">Category</span>
                    <span className="stat-value">{selectedEquipment.category_range}</span>
                  </div>
                )}

                {selectedEquipment.throw_range && (
                  <div className="stat-row">
                    <span className="stat-label">Throw Range</span>
                    <span className="stat-value">
                      {selectedEquipment.throw_range.normal} ft.
                      {selectedEquipment.throw_range.long && ` / ${selectedEquipment.throw_range.long} ft.`}
                    </span>
                  </div>
                )}
              </div>

              {selectedEquipment.properties && selectedEquipment.properties.length > 0 && (
                <div className="equipment-properties">
                  <h4>Properties</h4>
                  <div className="property-tags">
                    {selectedEquipment.properties.map((prop, idx) => (
                      <span key={idx} className="property-tag">{prop.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEquipment.desc && selectedEquipment.desc.length > 0 && (
                <div className="equipment-description">
                  <h4>Description</h4>
                  {selectedEquipment.desc.map((paragraph, idx) => (
                    <p key={idx}>{renderTextWithDiceRolls(paragraph)}</p>
                  ))}
                </div>
              )}

              {selectedEquipment.special && selectedEquipment.special.length > 0 && (
                <div className="equipment-special">
                  <h4>Special</h4>
                  {selectedEquipment.special.map((paragraph, idx) => (
                    <p key={idx}>{renderTextWithDiceRolls(paragraph)}</p>
                  ))}
                </div>
              )}

              {selectedEquipment.contents && selectedEquipment.contents.length > 0 && (
                <div className="equipment-contents">
                  <h4>Contents</h4>
                  <ul>
                    {selectedEquipment.contents.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity}× {item.item.name}
                      </li>
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

export default Equipment;
