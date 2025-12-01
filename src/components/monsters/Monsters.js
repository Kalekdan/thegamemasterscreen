import React, { useState, useEffect } from 'react';
import './Monsters.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const Monsters = ({ onDragStart, onDragEnd, setGlobalDiceResult, overlayTimeout, componentKey, initiativeTrackerRefs }) => {
  const [monsterList, setMonsterList] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTrackerSelector, setShowTrackerSelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedTrackerKey, setSelectedTrackerKey] = useState(null);

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm);
        if (savedState.selectedMonster !== undefined) setSelectedMonster(savedState.selectedMonster);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when it changes
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        searchTerm,
        selectedMonster
      });
    }
  }, [componentKey, searchTerm, selectedMonster, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  const fetchMonsterList = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.dnd5eapi.co/api/monsters');
      if (!response.ok) throw new Error('Failed to fetch monsters');
      const data = await response.json();
      setMonsterList(data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monster list on component mount
  useEffect(() => {
    fetchMonsterList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMonsterDetails = async (index) => {
    try {
      setLoading(true);
      const response = await fetch(`https://www.dnd5eapi.co/api/monsters/${index}`);
      if (!response.ok) throw new Error('Failed to fetch monster details');
      const data = await response.json();
      setSelectedMonster(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonsterSelect = (monster) => {
    fetchMonsterDetails(monster.index);
  };

  const handleBackToList = () => {
    setSelectedMonster(null);
    setSearchTerm('');
  };

  const formatModifier = (score) => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const getInitiativeTrackers = () => {
    return initiativeTrackerRefs ? Object.entries(initiativeTrackerRefs) : [];
  };

  const handleAddToTracker = (trackerKey, type) => {
    if (!selectedMonster || !initiativeTrackerRefs[trackerKey]) return;
    
    initiativeTrackerRefs[trackerKey].addMonster(selectedMonster, type);
    setShowTrackerSelector(false);
    setShowTypeSelector(false);
    setSelectedTrackerKey(null);
  };

  const handleTrackerSelected = (trackerKey) => {
    setSelectedTrackerKey(trackerKey);
    setShowTrackerSelector(false);
    setShowTypeSelector(true);
  };

  const handleAddToInitiativeClick = () => {
    const trackers = getInitiativeTrackers();
    
    if (trackers.length === 0) return;
    
    if (trackers.length === 1) {
      setSelectedTrackerKey(trackers[0][0]);
      setShowTypeSelector(true);
    } else {
      setShowTrackerSelector(true);
    }
  };

  const rollDice = (diceString) => {
    // Parse dice notation like "2d6+3", "2d6 + 3", or "1d8"
    // Remove spaces to normalize the format
    const normalized = diceString.replace(/\s+/g, '');
    const match = normalized.match(/(\d+)d(\d+)([+-]\d+)?/i);
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
    
    // Match dice notation patterns like 2d6+3, 2d6 + 3, 1d8, 3d10-2, or standalone +3 (which means d20+3)
    const dicePattern = /(\d+d\d+(?:\s*[+-]\s*\d+)?|[+-]\d+)/gi;
    const parts = text.split(dicePattern);
    
    return parts.map((part, index) => {
      const isDiceRoll = part.match(/\d+d\d+(?:\s*[+-]\s*\d+)?/i);
      const isModifier = part.match(/^[+-]\d+$/);
      
      if (isDiceRoll || isModifier) {
        // Convert standalone modifiers to d20+modifier format for rolling
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

  const filteredMonsters = monsterList.filter(monster =>
    monster.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="monsters">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>🐉 D&D 5e Monsters</h3>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {!selectedMonster ? (
        <div className="monster-list-view">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search monsters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="monster-search"
            />
          </div>

          {loading ? (
            <div className="loading">Loading monsters...</div>
          ) : (
            <div className="monster-list">
              {filteredMonsters.map((monster) => (
                <button
                  key={monster.index}
                  className="monster-list-item"
                  onClick={() => handleMonsterSelect(monster)}
                >
                  {monster.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="monster-details">
          <div className="monster-actions-bar">
            <button className="back-button" onClick={handleBackToList}>
              ← Back to List
            </button>
            <button 
              className={`add-to-initiative-btn ${getInitiativeTrackers().length === 0 ? 'disabled' : ''}`}
              onClick={handleAddToInitiativeClick}
              disabled={getInitiativeTrackers().length === 0}
              title={getInitiativeTrackers().length === 0 ? 'No Initiative Tracker found' : 'Add to Initiative Tracker'}
            >
              ⚔️ Add to Initiative
            </button>
          </div>

          {showTrackerSelector && getInitiativeTrackers().length > 1 && (
            <div className="tracker-selector-modal" onClick={() => setShowTrackerSelector(false)}>
              <div className="tracker-selector-content" onClick={(e) => e.stopPropagation()}>
                <h4>Select Initiative Tracker</h4>
                <p>Multiple initiative trackers found. Choose one:</p>
                <div className="tracker-list">
                  {getInitiativeTrackers().map(([key, methods]) => (
                    <button
                      key={key}
                      className="tracker-option highlight-pulse"
                      onClick={() => handleTrackerSelected(key)}
                    >
                      {methods.name || 'Initiative Tracker'}
                    </button>
                  ))}
                </div>
                <button 
                  className="cancel-button"
                  onClick={() => setShowTrackerSelector(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showTypeSelector && (
            <div className="tracker-selector-modal" onClick={() => {
              setShowTypeSelector(false);
              setSelectedTrackerKey(null);
            }}>
              <div className="tracker-selector-content" onClick={(e) => e.stopPropagation()}>
                <h4>Add as Ally or Enemy?</h4>
                <p>Choose how to add {selectedMonster.name}:</p>
                <div className="tracker-list">
                  <button
                    className="tracker-option ally-option"
                    onClick={() => handleAddToTracker(selectedTrackerKey, 'ally')}
                  >
                    ✓ Ally
                  </button>
                  <button
                    className="tracker-option enemy-option"
                    onClick={() => handleAddToTracker(selectedTrackerKey, 'enemy')}
                  >
                    ⚔ Enemy
                  </button>
                </div>
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setShowTypeSelector(false);
                    setSelectedTrackerKey(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <h2 className="monster-name">{selectedMonster.name}</h2>
              <div className="monster-subtitle">
                {selectedMonster.size} {selectedMonster.type}
                {selectedMonster.subtype && ` (${selectedMonster.subtype})`}, {selectedMonster.alignment}
              </div>

              <div className="stat-block">
                <div className="stat-row">
                  <span className="stat-label">Armor Class</span>
                  <span className="stat-value">
                    {selectedMonster.armor_class?.[0]?.value || selectedMonster.armor_class}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Hit Points</span>
                  <span className="stat-value">
                    {selectedMonster.hit_points} ({renderTextWithDiceRolls(selectedMonster.hit_points_roll || selectedMonster.hit_dice)})
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Speed</span>
                  <span className="stat-value">
                    {Object.entries(selectedMonster.speed).map(([key, value]) => 
                      `${key} ${value}`
                    ).join(', ')}
                  </span>
                </div>
              </div>

              <div className="ability-scores">
                {[
                  { abbr: 'STR', key: 'strength' },
                  { abbr: 'DEX', key: 'dexterity' },
                  { abbr: 'CON', key: 'constitution' },
                  { abbr: 'INT', key: 'intelligence' },
                  { abbr: 'WIS', key: 'wisdom' },
                  { abbr: 'CHA', key: 'charisma' }
                ].map((ability) => {
                  const score = selectedMonster[ability.key];
                  const modifier = Math.floor((score - 10) / 2);
                  const rollFormula = `1d20${modifier >= 0 ? '+' : ''}${modifier}`;
                  return (
                    <div 
                      key={ability.abbr} 
                      className="ability-score clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDiceClick(rollFormula);
                      }}
                      title={`Click to roll ${ability.abbr} check (${rollFormula})`}
                    >
                      <div className="ability-name">{ability.abbr}</div>
                      <div className="ability-value">{score}</div>
                      <div className="ability-modifier">{formatModifier(score)}</div>
                    </div>
                  );
                })}
              </div>

              {selectedMonster.proficiencies && selectedMonster.proficiencies.length > 0 && (
                <div className="stat-row">
                  <span className="stat-label">
                    {selectedMonster.proficiencies.some(p => p.proficiency.name.includes('Saving Throw')) ? 'Saving Throws' : 'Skills'}
                  </span>
                  <span className="stat-value">
                    {selectedMonster.proficiencies.map((p, idx) => {
                      const name = p.proficiency.name.replace('Skill: ', '').replace('Saving Throw: ', '');
                      const bonus = `${p.value >= 0 ? '+' : ''}${p.value}`;
                      const rollFormula = `1d20${bonus}`;
                      return (
                        <span key={idx}>
                          {idx > 0 && ', '}
                          {name}{' '}
                          <span
                            className="dice-roll-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDiceClick(rollFormula);
                            }}
                            title={`Click to roll ${name} (${rollFormula})`}
                          >
                            {bonus}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                </div>
              )}

              {selectedMonster.damage_vulnerabilities && selectedMonster.damage_vulnerabilities.length > 0 && (
                <div className="stat-row">
                  <span className="stat-label">Damage Vulnerabilities</span>
                  <span className="stat-value">{selectedMonster.damage_vulnerabilities.join(', ')}</span>
                </div>
              )}

              {selectedMonster.damage_resistances && selectedMonster.damage_resistances.length > 0 && (
                <div className="stat-row">
                  <span className="stat-label">Damage Resistances</span>
                  <span className="stat-value">{selectedMonster.damage_resistances.join(', ')}</span>
                </div>
              )}

              {selectedMonster.damage_immunities && selectedMonster.damage_immunities.length > 0 && (
                <div className="stat-row">
                  <span className="stat-label">Damage Immunities</span>
                  <span className="stat-value">{selectedMonster.damage_immunities.join(', ')}</span>
                </div>
              )}

              {selectedMonster.condition_immunities && selectedMonster.condition_immunities.length > 0 && (
                <div className="stat-row">
                  <span className="stat-label">Condition Immunities</span>
                  <span className="stat-value">
                    {selectedMonster.condition_immunities.map(c => c.name).join(', ')}
                  </span>
                </div>
              )}

              {selectedMonster.senses && (
                <div className="stat-row">
                  <span className="stat-label">Senses</span>
                  <span className="stat-value">
                    {Object.entries(selectedMonster.senses).map(([key, value]) => 
                      key !== 'passive_perception' ? `${key} ${value}` : null
                    ).filter(Boolean).join(', ')}
                    {selectedMonster.senses.passive_perception && 
                      `, passive Perception ${selectedMonster.senses.passive_perception}`}
                  </span>
                </div>
              )}

              {selectedMonster.languages && (
                <div className="stat-row">
                  <span className="stat-label">Languages</span>
                  <span className="stat-value">{selectedMonster.languages || '—'}</span>
                </div>
              )}

              <div className="stat-row">
                <span className="stat-label">Challenge</span>
                <span className="stat-value">
                  {selectedMonster.challenge_rating} ({selectedMonster.xp?.toLocaleString() || 0} XP)
                </span>
              </div>

              {selectedMonster.special_abilities && selectedMonster.special_abilities.length > 0 && (
                <div className="abilities-section">
                  <h4>Special Abilities</h4>
                  {selectedMonster.special_abilities.map((ability, idx) => (
                    <div key={idx} className="ability-item">
                      <strong>{ability.name}.</strong> {renderTextWithDiceRolls(ability.desc)}
                    </div>
                  ))}
                </div>
              )}

              {selectedMonster.actions && selectedMonster.actions.length > 0 && (
                <div className="abilities-section">
                  <h4>Actions</h4>
                  {selectedMonster.actions.map((action, idx) => (
                    <div key={idx} className="ability-item">
                      <strong>{action.name}.</strong> {renderTextWithDiceRolls(action.desc)}
                    </div>
                  ))}
                </div>
              )}

              {selectedMonster.legendary_actions && selectedMonster.legendary_actions.length > 0 && (
                <div className="abilities-section">
                  <h4>Legendary Actions</h4>
                  {selectedMonster.legendary_actions.map((action, idx) => (
                    <div key={idx} className="ability-item">
                      <strong>{action.name}.</strong> {renderTextWithDiceRolls(action.desc)}
                    </div>
                  ))}
                </div>
              )}

              {selectedMonster.reactions && selectedMonster.reactions.length > 0 && (
                <div className="abilities-section">
                  <h4>Reactions</h4>
                  {selectedMonster.reactions.map((reaction, idx) => (
                    <div key={idx} className="ability-item">
                      <strong>{reaction.name}.</strong> {renderTextWithDiceRolls(reaction.desc)}
                    </div>
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

export default Monsters;
