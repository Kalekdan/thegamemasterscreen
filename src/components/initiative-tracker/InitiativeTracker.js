import React, { useState, useEffect, useCallback } from 'react';
import './InitiativeTracker.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const InitiativeTracker = ({ onDragStart, onDragEnd, setGlobalDiceResult, componentKey, registerInitiativeTracker, unregisterInitiativeTracker, defaultName }) => {
  const [entries, setEntries] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'minimal'
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null); // Track which field is being edited
  const [customCondition, setCustomCondition] = useState('');
  const [showCustomConditionFor, setShowCustomConditionFor] = useState(null);
  const [showHpAdjustFor, setShowHpAdjustFor] = useState(null);
  const [hpAdjustValue, setHpAdjustValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [trackerName, setTrackerName] = useState('Initiative Tracker');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.entries !== undefined) setEntries(savedState.entries);
        if (savedState.currentTurn !== undefined) setCurrentTurn(savedState.currentTurn);
        if (savedState.roundNumber !== undefined) setRoundNumber(savedState.roundNumber);
        if (savedState.viewMode !== undefined) setViewMode(savedState.viewMode);
        if (savedState.trackerName !== undefined) {
          setTrackerName(savedState.trackerName);
        } else if (defaultName) {
          setTrackerName(defaultName);
        }
      } else if (defaultName) {
        setTrackerName(defaultName);
      }
      setIsInitialized(true);
    }
  }, [componentKey, defaultName]);

  const conditionsList = [
    'Blinded', 'Charmed', 'Concentrating', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
    'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Exhaustion'
  ];

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  const addEntry = (type = 'ally') => {
    const entry = {
      id: Date.now(),
      name: `${type === 'ally' ? 'Ally' : 'Enemy'} ${entries.filter(e => e.type === type).length + 1}`,
      initiative: 10,
      hp: 10,
      maxHp: 10,
      ac: 10,
      type: type,
      conditions: []
    };

    const newEntries = [...entries, entry].sort((a, b) => b.initiative - a.initiative);
    setEntries(newEntries);
    setEditingId(entry.id);
  };

  const addMonsterEntry = useCallback((monsterData, type = 'enemy') => {
    const entry = {
      id: Date.now(),
      name: monsterData.name,
      initiative: 10,
      hp: monsterData.hit_points || 10,
      maxHp: monsterData.hit_points || 10,
      ac: monsterData.armor_class?.[0]?.value || monsterData.armor_class || 10,
      type: type,
      conditions: []
    };

    setEntries(prevEntries => {
      const newEntries = [...prevEntries, entry].sort((a, b) => b.initiative - a.initiative);
      return newEntries;
    });
    setEditingId(entry.id);
  }, []);

  // Register this tracker's methods with parent
  useEffect(() => {
    if (componentKey && registerInitiativeTracker) {
      registerInitiativeTracker(componentKey, {
        addMonster: addMonsterEntry
      }, trackerName);
    }
    return () => {
      if (componentKey && unregisterInitiativeTracker) {
        unregisterInitiativeTracker(componentKey);
      }
    };
  }, [componentKey, registerInitiativeTracker, unregisterInitiativeTracker, trackerName, addMonsterEntry]);

  // Save state when it changes
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        entries,
        currentTurn,
        roundNumber,
        viewMode,
        trackerName
      });
    }
  }, [componentKey, entries, currentTurn, roundNumber, viewMode, trackerName, isInitialized]);

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const finishEditingInitiative = () => {
    // Re-sort when done editing initiative
    setEntries(prev => [...prev].sort((a, b) => b.initiative - a.initiative));
    setEditingId(null);
    setEditingField(null);
  };

  const startEditing = (id, field) => {
    setEditingId(id);
    setEditingField(field);
  };

  const finishEditing = () => {
    setEditingId(null);
    setEditingField(null);
  };

  const removeEntry = (id) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    if (currentTurn >= newEntries.length) {
      setCurrentTurn(0);
    }
  };

  const nextTurn = () => {
    if (entries.length === 0) return;
    
    const nextIndex = (currentTurn + 1) % entries.length;
    setCurrentTurn(nextIndex);
    
    // If we're back to the first entry, increment round
    if (nextIndex === 0) {
      setRoundNumber(roundNumber + 1);
    }
    setEditingId(null);
  };

  const previousTurn = () => {
    if (entries.length === 0) return;
    
    const prevIndex = currentTurn === 0 ? entries.length - 1 : currentTurn - 1;
    setCurrentTurn(prevIndex);
    
    // If we're going back from the first entry, decrement round
    if (currentTurn === 0 && roundNumber > 1) {
      setRoundNumber(roundNumber - 1);
    }
    setEditingId(null);
  };

  const updateHP = (id, newHp) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, hp: Math.max(0, newHp) } : e
    ));
  };

  const adjustHP = (id, amount) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, hp: Math.max(0, e.hp + amount) } : e
    ));
  };

  const toggleCondition = (id, condition) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        const hasCondition = e.conditions.includes(condition);
        return {
          ...e,
          conditions: hasCondition 
            ? e.conditions.filter(c => c !== condition)
            : [...e.conditions, condition]
        };
      }
      return e;
    }));
  };

  const addCustomCondition = (id, condition = null) => {
    const conditionToAdd = condition || customCondition.trim();
    if (!conditionToAdd) return;
    
    setEntries(entries.map(e => {
      if (e.id === id && !e.conditions.includes(conditionToAdd)) {
        return {
          ...e,
          conditions: [...e.conditions, conditionToAdd]
        };
      }
      return e;
    }));
    setCustomCondition('');
    setShowCustomConditionFor(null);
  };

  const adjustHPByValue = (id) => {
    const value = hpAdjustValue.trim();
    if (!value) return;
    
    // Parse +/- value
    const amount = parseInt(value);
    if (isNaN(amount)) return;
    
    adjustHP(id, amount);
    setHpAdjustValue('');
    setShowHpAdjustFor(null);
  };

  const getConditionSuggestions = () => {
    if (!customCondition) return [];
    const search = customCondition.toLowerCase();
    return conditionsList.filter(c => c.toLowerCase().includes(search));
  };

  const resetCombat = () => {
    setEntries([]);
    setCurrentTurn(0);
    setRoundNumber(1);
  };

  return (
    <div className="initiative-tracker">
      <div
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
      >
        ⋮⋮
      </div>
      <div className="tracker-header">
        <div className="header-left">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => {
                if (tempName.trim()) {
                  setTrackerName(tempName.trim());
                }
                setIsEditingName(false);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (tempName.trim()) {
                    setTrackerName(tempName.trim());
                  }
                  setIsEditingName(false);
                }
              }}
              className="tracker-name-input"
              autoFocus
            />
          ) : (
            <h3 
              className="tracker-title always-visible"
              onClick={() => {
                setTempName(trackerName);
                setIsEditingName(true);
              }}
              title="Click to edit name"
            >
              ⚔️ {trackerName}
            </h3>
          )}
          <div className="round-display">Round {roundNumber}</div>
        </div>
      </div>

      <div className="tracker-controls">
        <button 
          onClick={() => setViewMode(viewMode === 'detailed' ? 'minimal' : 'detailed')} 
          className="view-toggle-btn"
          title={viewMode === 'detailed' ? 'Switch to minimal view' : 'Switch to detailed view'}
        >
          {viewMode === 'detailed' ? '🔽 Minimal' : '🔼 Detailed'}
        </button>
        <button onClick={() => addEntry('ally')} className="add-entry-btn ally">
          ➕ Ally
        </button>
        <button onClick={() => addEntry('enemy')} className="add-entry-btn enemy">
          ➕ Enemy
        </button>
        <button onClick={previousTurn} disabled={entries.length === 0} className="turn-btn prev-turn-btn">
          ⬅️
        </button>
        <button onClick={nextTurn} disabled={entries.length === 0} className="turn-btn next-turn-btn">
          Next ➡️
        </button>
        {entries.length > 0 && (
          <button onClick={resetCombat} className="reset-btn" title="Clear all entries">
            🔄
          </button>
        )}
      </div>

      <div className="initiative-list">
        {entries.length === 0 ? (
          <div className="empty-message">No combatants yet. Click "Add Ally" or "Add Enemy" to begin!</div>
        ) : (
          entries.map((entry, index) => {
            const isEditing = editingId === entry.id;
            const isMinimal = viewMode === 'minimal';
            
            return (
              <div
                key={entry.id}
                className={`initiative-entry ${entry.type} ${index === currentTurn ? 'current-turn' : ''} ${isMinimal ? 'minimal-view' : ''}`}
              >
                <div className="entry-header">
                  <div className="entry-name-section">
                    {isEditing && editingField === 'initiative' ? (
                      <input
                        type="number"
                        value={entry.initiative}
                        onChange={(e) => updateEntry(entry.id, 'initiative', parseInt(e.target.value) || 0)}
                        className="initiative-number-input"
                        onBlur={finishEditingInitiative}
                        onKeyDown={(e) => e.key === 'Enter' && finishEditingInitiative()}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className={`initiative-number ${entry.hp <= 0 ? 'combatant-down' : ''}`}
                        onClick={() => startEditing(entry.id, 'initiative')}
                        title="Click to edit"
                      >
                        {entry.initiative}{entry.hp <= 0 ? ' 💀' : ''}
                      </span>
                    )}
                    {isEditing && editingField === 'name' ? (
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                        className="entry-name-input"
                        onBlur={finishEditing}
                        onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                        autoFocus
                      />
                    ) : (
                      <div className="entry-name-wrapper">
                        <span 
                          className={`entry-name ${entry.hp <= 0 ? 'combatant-down' : ''}`}
                          onClick={() => startEditing(entry.id, 'name')}
                          title="Click to edit"
                        >
                          {entry.name}
                        </span>
                        {isMinimal && (
                          <div className="minimal-stats-inline">
                            <button 
                              onClick={() => setShowHpAdjustFor(entry.id)}
                              className="hp-adjust-quick-btn"
                              title="Adjust HP"
                            >
                              ±
                            </button>
                            {isEditing && editingField === 'hp' ? (
                              <input
                                type="number"
                                value={entry.hp}
                                onChange={(e) => updateEntry(entry.id, 'hp', parseInt(e.target.value) || 0)}
                                className="stat-inline-input"
                                onBlur={finishEditing}
                                onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="stat-inline" 
                                onClick={() => startEditing(entry.id, 'hp')}
                                title="Click to edit HP"
                              >
                                {entry.hp}
                              </span>
                            )}
                            <span className="stat-divider">/</span>
                            {isEditing && editingField === 'maxHp' ? (
                              <input
                                type="number"
                                value={entry.maxHp}
                                onChange={(e) => updateEntry(entry.id, 'maxHp', parseInt(e.target.value) || 0)}
                                className="stat-inline-input"
                                onBlur={finishEditing}
                                onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="stat-inline" 
                                onClick={() => startEditing(entry.id, 'maxHp')}
                                title="Click to edit max HP"
                              >
                                {entry.maxHp}
                              </span>
                            )}
                            <span className="stat-label">HP</span>
                            <span className="stat-separator">|</span>
                            {isEditing && editingField === 'ac' ? (
                              <input
                                type="number"
                                value={entry.ac}
                                onChange={(e) => updateEntry(entry.id, 'ac', parseInt(e.target.value) || 0)}
                                className="stat-inline-input"
                                onBlur={finishEditing}
                                onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="stat-inline" 
                                onClick={() => startEditing(entry.id, 'ac')}
                                title="Click to edit AC"
                              >
                                {entry.ac}
                              </span>
                            )}
                            <span className="stat-label">AC</span>
                          </div>
                        )}
                      </div>
                    )}
                    {index === currentTurn && <span className="turn-indicator">◀ TURN</span>}
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="remove-btn" title="Remove">
                    ❌
                  </button>
                </div>

                {!isMinimal && (
                  <div className="entry-stats">
                    <div className="stat-group">
                      <label>HP</label>
                      <div className="hp-controls">
                        <button onClick={() => adjustHP(entry.id, -5)} className="hp-adjust-btn">-5</button>
                        <button onClick={() => adjustHP(entry.id, -1)} className="hp-adjust-btn">-1</button>
                        <input
                          type="number"
                          value={entry.hp}
                          onChange={(e) => updateHP(entry.id, parseInt(e.target.value) || 0)}
                          className="hp-input"
                        />
                        <span className="hp-max">/ </span>
                        {isEditing && editingField === 'maxHp' ? (
                          <input
                            type="number"
                            value={entry.maxHp}
                            onChange={(e) => updateEntry(entry.id, 'maxHp', parseInt(e.target.value) || 0)}
                            className="hp-input"
                            onBlur={finishEditing}
                            onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                            autoFocus
                          />
                        ) : (
                          <span className="hp-max" onClick={() => startEditing(entry.id, 'maxHp')} title="Click to edit max HP">{entry.maxHp}</span>
                        )}
                        <button onClick={() => adjustHP(entry.id, 1)} className="hp-adjust-btn">+1</button>
                        <button onClick={() => adjustHP(entry.id, 5)} className="hp-adjust-btn">+5</button>
                      </div>
                      <div className="hp-bar-container">
                        <div 
                          className="hp-bar" 
                          style={{ width: `${(entry.hp / entry.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="stat-item">
                      <label>AC</label>
                      {isEditing && editingField === 'ac' ? (
                        <input
                          type="number"
                          value={entry.ac}
                          onChange={(e) => updateEntry(entry.id, 'ac', parseInt(e.target.value) || 0)}
                          className="stat-value-input"
                          onBlur={finishEditing}
                          onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="stat-value" 
                          onClick={() => startEditing(entry.id, 'ac')}
                          title="Click to edit"
                        >
                          {entry.ac}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {isMinimal && showHpAdjustFor === entry.id && (
                  <div className="hp-adjust-inline">
                    <input
                      type="text"
                      placeholder="+12 or -5"
                      value={hpAdjustValue}
                      onChange={(e) => setHpAdjustValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') adjustHPByValue(entry.id);
                        if (e.key === 'Escape') setShowHpAdjustFor(null);
                      }}
                      onBlur={() => setShowHpAdjustFor(null)}
                      className="hp-adjust-input"
                      autoFocus
                    />
                  </div>
                )}
                {isMinimal && (
                  <div className="minimal-stats">
                    <button 
                      onClick={() => setShowCustomConditionFor(entry.id)}
                      className="add-condition-btn"
                      title="Add condition"
                    >
                      ⊕ Condition
                    </button>
                  </div>
                )}

                {!isMinimal && (
                  <div className="conditions-section">
                    <label>Conditions:</label>
                    <div className="conditions-grid">
                      {conditionsList.map(condition => (
                        <button
                          key={condition}
                          onClick={() => toggleCondition(entry.id, condition)}
                          className={`condition-btn ${entry.conditions.includes(condition) ? 'active' : ''}`}
                          title={condition}
                        >
                          {condition}
                        </button>
                      ))}
                      {/* Show custom conditions that aren't in the standard list */}
                      {entry.conditions.filter(c => !conditionsList.includes(c)).map(condition => (
                        <button
                          key={condition}
                          onClick={() => toggleCondition(entry.id, condition)}
                          className="condition-btn active custom"
                          title={`Custom: ${condition}`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                    <div className="custom-condition-input">
                      <input
                        type="text"
                        placeholder="Add custom condition..."
                        value={customCondition}
                        onChange={(e) => setCustomCondition(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomCondition(entry.id)}
                        className="custom-input"
                      />
                      <button onClick={() => addCustomCondition(entry.id)} className="add-custom-btn">
                        Add
                      </button>
                    </div>
                    {customCondition && getConditionSuggestions().length > 0 && (
                      <div className="condition-suggestions">
                        {getConditionSuggestions().map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              addCustomCondition(entry.id, suggestion);
                            }}
                            className="suggestion-btn"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {isMinimal && entry.conditions.length > 0 && (
                  <div className="conditions-minimal">
                    {entry.conditions.map(c => (
                      <span key={c} className="condition-badge" onClick={() => toggleCondition(entry.id, c)}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {isMinimal && showCustomConditionFor === entry.id && (
                  <div className="custom-condition-inline">
                    <input
                      type="text"
                      placeholder="Type condition name..."
                      value={customCondition}
                      onChange={(e) => setCustomCondition(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCustomCondition(entry.id);
                        if (e.key === 'Escape') setShowCustomConditionFor(null);
                      }}
                      onBlur={(e) => {
                        // Delay to allow clicking suggestions
                        setTimeout(() => setShowCustomConditionFor(null), 200);
                      }}
                      className="custom-input-minimal"
                      autoFocus
                    />
                    {customCondition && getConditionSuggestions().length > 0 && (
                      <div className="condition-suggestions-minimal">
                        {getConditionSuggestions().map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              addCustomCondition(entry.id, suggestion);
                            }}
                            className="suggestion-btn-minimal"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InitiativeTracker;
