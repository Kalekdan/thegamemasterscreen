import React, { useState, useEffect } from 'react';
import './Spells.css';

const Spells = ({ onDragStart, onDragEnd, setGlobalDiceResult }) => {
  const [spellList, setSpellList] = useState([]);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedLevels, setCollapsedLevels] = useState({});

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  // Fetch spell list on component mount
  useEffect(() => {
    fetchSpellList();
  }, []);

  const fetchSpellList = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.dnd5eapi.co/api/spells');
      if (!response.ok) throw new Error('Failed to fetch spells');
      const data = await response.json();
      setSpellList(data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpellDetails = async (index) => {
    try {
      setLoading(true);
      const response = await fetch(`https://www.dnd5eapi.co/api/spells/${index}`);
      if (!response.ok) throw new Error('Failed to fetch spell details');
      const data = await response.json();
      setSelectedSpell(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpellSelect = (spell) => {
    fetchSpellDetails(spell.index);
  };

  const handleBackToList = () => {
    setSelectedSpell(null);
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

  const getOrdinalLevel = (level) => {
    if (level === 0) return 'Cantrip';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = level % 100;
    return level + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  };

  const filteredSpells = spellList.filter(spell => 
    spell.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group spells by level and sort alphabetically within each level
  const spellsByLevel = filteredSpells.reduce((acc, spell) => {
    const level = spell.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(spell);
    return acc;
  }, {});

  // Sort spells within each level alphabetically
  Object.keys(spellsByLevel).forEach(level => {
    spellsByLevel[level].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Sort level keys
  const sortedLevels = Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b));

  const toggleLevel = (level) => {
    setCollapsedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getLevelLabel = (level) => {
    return level === '0' ? 'Cantrips' : `Level ${level}`;
  };

  return (
    <div className="spells">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>✨ D&D 5e Spells</h3>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {!selectedSpell ? (
        <div className="spell-list-view">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search spells..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="spell-search"
            />
          </div>

          {loading ? (
            <div className="loading">Loading spells...</div>
          ) : (
            <div className="spell-list">
              {sortedLevels.length === 0 ? (
                <div className="no-results">No spells found</div>
              ) : (
                sortedLevels.map(level => (
                  <div key={level} className="spell-level-group">
                    <button
                      className="spell-level-header"
                      onClick={() => toggleLevel(level)}
                    >
                      <span className="level-toggle-icon">
                        {collapsedLevels[level] ? '▶' : '▼'}
                      </span>
                      <span className="level-label">{getLevelLabel(level)}</span>
                      <span className="level-count">({spellsByLevel[level].length})</span>
                    </button>
                    {!collapsedLevels[level] && (
                      <div className="spell-level-items">
                        {spellsByLevel[level].map((spell) => (
                          <button
                            key={spell.index}
                            className="spell-list-item"
                            onClick={() => handleSpellSelect(spell)}
                          >
                            <span className="spell-list-name">{spell.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="spell-details">
          <button className="back-button" onClick={handleBackToList}>
            ← Back to List
          </button>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <h2 className="spell-name">{selectedSpell.name}</h2>
              <div className="spell-subtitle">
                {getOrdinalLevel(selectedSpell.level)} {selectedSpell.school?.name || selectedSpell.school}
                {selectedSpell.ritual && ' (Ritual)'}
              </div>

              <div className="stat-block">
                <div className="stat-row">
                  <span className="stat-label">Casting Time</span>
                  <span className="stat-value">{selectedSpell.casting_time}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Range</span>
                  <span className="stat-value">{selectedSpell.range}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Components</span>
                  <span className="stat-value">
                    {selectedSpell.components?.join(', ')}
                    {selectedSpell.material && ` (${selectedSpell.material})`}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">
                    {selectedSpell.concentration ? 'Concentration, ' : ''}
                    {selectedSpell.duration}
                  </span>
                </div>
              </div>

              {selectedSpell.desc && selectedSpell.desc.length > 0 && (
                <div className="spell-description">
                  {selectedSpell.desc.map((paragraph, idx) => (
                    <p key={idx}>{renderTextWithDiceRolls(paragraph)}</p>
                  ))}
                </div>
              )}

              {selectedSpell.higher_level && selectedSpell.higher_level.length > 0 && (
                <div className="spell-higher-level">
                  <h4>At Higher Levels</h4>
                  {selectedSpell.higher_level.map((paragraph, idx) => (
                    <p key={idx}>{renderTextWithDiceRolls(paragraph)}</p>
                  ))}
                </div>
              )}

              {selectedSpell.damage && (
                <div className="spell-damage">
                  <h4>Damage</h4>
                  <div className="stat-row">
                    <span className="stat-label">Type</span>
                    <span className="stat-value">{selectedSpell.damage.damage_type?.name}</span>
                  </div>
                  {selectedSpell.damage.damage_at_slot_level && (
                    <div className="damage-scaling">
                      <strong>Damage by Slot Level:</strong>
                      <div className="damage-grid">
                        {Object.entries(selectedSpell.damage.damage_at_slot_level).map(([level, damage]) => (
                          <div key={level} className="damage-level-item">
                            <span className="damage-level">Level {level}:</span>
                            <span className="damage-value">{renderTextWithDiceRolls(damage)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSpell.damage.damage_at_character_level && (
                    <div className="damage-scaling">
                      <strong>Damage by Character Level:</strong>
                      <div className="damage-grid">
                        {Object.entries(selectedSpell.damage.damage_at_character_level).map(([level, damage]) => (
                          <div key={level} className="damage-level-item">
                            <span className="damage-level">Level {level}:</span>
                            <span className="damage-value">{renderTextWithDiceRolls(damage)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedSpell.heal_at_slot_level && (
                <div className="spell-healing">
                  <h4>Healing</h4>
                  <div className="damage-scaling">
                    <strong>Healing by Slot Level:</strong>
                    <div className="damage-grid">
                      {Object.entries(selectedSpell.heal_at_slot_level).map(([level, healing]) => (
                        <div key={level} className="damage-level-item">
                          <span className="damage-level">Level {level}:</span>
                          <span className="damage-value">{renderTextWithDiceRolls(healing)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedSpell.dc && (
                <div className="stat-row">
                  <span className="stat-label">Save</span>
                  <span className="stat-value">
                    {selectedSpell.dc.dc_type?.name} (DC based on spellcasting ability)
                  </span>
                </div>
              )}

              {selectedSpell.area_of_effect && (
                <div className="stat-row">
                  <span className="stat-label">Area of Effect</span>
                  <span className="stat-value">
                    {selectedSpell.area_of_effect.size} ft. {selectedSpell.area_of_effect.type}
                  </span>
                </div>
              )}

              {selectedSpell.classes && selectedSpell.classes.length > 0 && (
                <div className="spell-classes">
                  <strong>Classes:</strong> {selectedSpell.classes.map(c => c.name).join(', ')}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Spells;
