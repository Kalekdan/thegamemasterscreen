import React, { useState } from 'react';
import './DiceRoller.css';

const DiceRoller = ({ onDragStart, onDragEnd, setGlobalDiceResult, overlayTimeout }) => {
  const [results, setResults] = useState([]);
  const [diceFormula, setDiceFormula] = useState('');
  const [formulaError, setFormulaError] = useState('');
  const [rollMode, setRollMode] = useState('flat'); // 'flat', 'advantage', 'disadvantage'

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  const diceTypes = [
    { sides: 4, color: '#ff6b6b' },
    { sides: 6, color: '#4ecdc4' },
    { sides: 8, color: '#45b7d1' },
    { sides: 10, color: '#96ceb4' },
    { sides: 12, color: '#ffeaa7' },
    { sides: 20, color: '#a29bfe' },
    { sides: 100, color: '#fd79a8' },
  ];

  const rollDice = (sides) => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const handleQuickRoll = (sides) => {
    let rollResults;
    if (rollMode === 'flat') {
      const result = rollDice(sides);
      rollResults = [{
        sides,
        value: result,
        isQuick: true
      }];
      setResults(rollResults);
      
      // Output to global overlay
      if (setGlobalDiceResult) {
        setGlobalDiceResult({
          formula: `1d${sides}`,
          rolls: [result],
          modifier: 0,
          total: result
        });
      }
    } else {
      // Roll twice for advantage/disadvantage
      const roll1 = rollDice(sides);
      const roll2 = rollDice(sides);
      const chosenValue = rollMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      
      rollResults = [
        {
          sides,
          value: roll1,
          isQuick: true,
          isChosen: roll1 === chosenValue && roll1 !== roll2,
          isDiscarded: roll1 !== chosenValue
        },
        {
          sides,
          value: roll2,
          isQuick: true,
          isChosen: roll2 === chosenValue && roll1 !== roll2,
          isDiscarded: roll2 !== chosenValue
        }
      ];
      setResults(rollResults);
      
      // Output to global overlay
      if (setGlobalDiceResult) {
        const mode = rollMode === 'advantage' ? 'Advantage' : 'Disadvantage';
        setGlobalDiceResult({
          formula: `1d${sides} (${mode})`,
          rolls: [roll1, roll2],
          modifier: 0,
          total: chosenValue
        });
      }
    }
  };

  const parseDiceFormula = (formula) => {
    // Remove all spaces
    const cleaned = formula.replace(/\s/g, '');
    
    if (!cleaned) {
      throw new Error('Please enter a formula');
    }
    
    // Parse the formula into tokens (dice groups and modifiers)
    // Match patterns like: 3d20, +5, -2, +2d6, etc.
    const tokens = [];
    const diceRegex = /([+-]?)(\d+)d(\d+)/gi;
    let lastIndex = 0;
    let match;
    
    // Find all dice groups (e.g., 3d20, +2d6, -1d8)
    while ((match = diceRegex.exec(cleaned)) !== null) {
      // Check for modifiers between dice groups
      if (match.index > lastIndex) {
        const between = cleaned.substring(lastIndex, match.index);
        const modMatch = between.match(/([+-]\d+)/g);
        if (modMatch) {
          modMatch.forEach(mod => tokens.push({ type: 'modifier', value: parseInt(mod) }));
        }
      }
      
      const sign = match[1] === '-' ? -1 : 1;
      const count = parseInt(match[2]);
      const sides = parseInt(match[3]);
      
      if (count < 1 || count > 100) {
        throw new Error(`Dice count must be 1-100 (found ${count})`);
      }
      
      if (sides < 2 || sides > 1000) {
        throw new Error(`Dice sides must be 2-1000 (found ${sides})`);
      }
      
      tokens.push({ type: 'dice', count, sides, sign });
      lastIndex = diceRegex.lastIndex;
    }
    
    // Check for trailing modifiers
    if (lastIndex < cleaned.length) {
      const remaining = cleaned.substring(lastIndex);
      const modMatch = remaining.match(/([+-]\d+)/g);
      if (modMatch) {
        modMatch.forEach(mod => tokens.push({ type: 'modifier', value: parseInt(mod) }));
      } else if (remaining.match(/[^\s]/)) {
        throw new Error('Invalid formula format');
      }
    }
    
    if (tokens.length === 0) {
      throw new Error('Invalid format. Use format like: 3d20+5 or 2d6+3d8-2');
    }
    
    return tokens;
  };

  const handleFormulaRoll = () => {
    setFormulaError('');
    
    if (!diceFormula.trim()) {
      setFormulaError('Please enter a dice formula');
      return;
    }
    
    try {
      const tokens = parseDiceFormula(diceFormula);
      
      const rolls = [];
      let totalModifier = 0;
      
      tokens.forEach(token => {
        if (token.type === 'dice') {
          // Apply advantage/disadvantage only to d20 rolls in formulas
          const applyRollMode = token.sides === 20 && rollMode !== 'flat' && token.count === 1;
          
          if (applyRollMode) {
            const roll1 = rollDice(token.sides);
            const roll2 = rollDice(token.sides);
            const chosenValue = rollMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
            
            rolls.push(
              {
                sides: token.sides,
                value: roll1,
                sign: token.sign,
                isQuick: false,
                isChosen: roll1 === chosenValue && roll1 !== roll2,
                isDiscarded: roll1 !== chosenValue
              },
              {
                sides: token.sides,
                value: roll2,
                sign: token.sign,
                isQuick: false,
                isChosen: roll2 === chosenValue && roll1 !== roll2,
                isDiscarded: roll2 !== chosenValue
              }
            );
          } else {
            for (let i = 0; i < token.count; i++) {
              rolls.push({
                sides: token.sides,
                value: rollDice(token.sides),
                sign: token.sign,
                isQuick: false
              });
            }
          }
        } else if (token.type === 'modifier') {
          totalModifier += token.value;
        }
      });
      
      // Add modifier to results if present
      if (totalModifier !== 0) {
        rolls.push({ modifier: totalModifier, isModifier: true });
      }
      
      setResults(rolls);
      
      // Output to global overlay
      if (setGlobalDiceResult) {
        const diceRolls = rolls.filter(r => !r.isModifier && !r.isDiscarded).map(r => r.value);
        const total = rolls.reduce((sum, r) => {
          if (r.isModifier) return sum + r.modifier;
          if (r.isDiscarded) return sum;
          return sum + (r.value * (r.sign || 1));
        }, 0);
        
        setGlobalDiceResult({
          formula: diceFormula,
          rolls: diceRolls,
          modifier: totalModifier,
          total: total
        });
      }
    } catch (error) {
      setFormulaError(error.message);
    }
  };

  const calculateTotal = (includeDiscarded = false) => {
    let sum = 0;
    let mod = 0;
    results.forEach(result => {
      if (result.isModifier) {
        mod = result.modifier;
      } else if (includeDiscarded || !result.isDiscarded) {
        const sign = result.sign !== undefined ? result.sign : 1;
        sum += result.value * sign;
      }
    });
    return sum + mod;
  };

  const hasAdvantageRolls = results.some(r => r.isChosen !== undefined || r.isDiscarded);
  const total = calculateTotal();
  const hasModifier = results.some(r => r.isModifier);
  const modifier = hasModifier ? results.find(r => r.isModifier).modifier : 0;
  
  // Calculate alternate total (what would have been rolled with the other die)
  const alternateTotal = hasAdvantageRolls ? (() => {
    let sum = 0;
    let mod = 0;
    results.forEach(result => {
      if (result.isModifier) {
        mod = result.modifier;
      } else if (result.isDiscarded) {
        const sign = result.sign !== undefined ? result.sign : 1;
        sum += result.value * sign;
      }
    });
    return sum + mod;
  })() : null;

  const isCrit = (result) => {
    if (result.isModifier) return null;
    if (result.value === result.sides) return 'success';
    if (result.value === 1) return 'failure';
    return null;
  };

  return (
    <div className="dice-roller">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      <h3>🎲 Dice Roller</h3>
      
      <div className="quick-roll-section">
        <div className="quick-roll-header">
          <p className="section-label">Quick Roll</p>
          <div className="roll-mode-toggle">
            <button
              className={`mode-button ${rollMode === 'disadvantage' ? 'active' : ''}`}
              onClick={() => setRollMode('disadvantage')}
              title="Disadvantage - Roll twice, use lower"
            >
              Disadv
            </button>
            <button
              className={`mode-button ${rollMode === 'flat' ? 'active' : ''}`}
              onClick={() => setRollMode('flat')}
              title="Normal roll"
            >
              Flat
            </button>
            <button
              className={`mode-button ${rollMode === 'advantage' ? 'active' : ''}`}
              onClick={() => setRollMode('advantage')}
              title="Advantage - Roll twice, use higher"
            >
              Adv
            </button>
          </div>
        </div>
        <div className="dice-selection">
          {diceTypes.map((dice) => (
            <button
              key={dice.sides}
              className="dice-button"
              style={{ backgroundColor: dice.color }}
              onClick={() => handleQuickRoll(dice.sides)}
            >
              d{dice.sides}
            </button>
          ))}
        </div>
      </div>

      <div className="formula-section">
        <p className="section-label">Custom Formula</p>
        <div className="formula-input-group">
          <input
            type="text"
            className="formula-input"
            placeholder="e.g. 3d8+5"
            value={diceFormula}
            onChange={(e) => setDiceFormula(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFormulaRoll()}
          />
          <button className="formula-roll-button" onClick={handleFormulaRoll}>
            Roll
          </button>
        </div>
        {formulaError && <div className="formula-error">{formulaError}</div>}
      </div>

      {results.length > 0 && (
        <div className="results">
          {hasAdvantageRolls ? (
            <div className="advantage-results-container">
              <div className="advantage-outcome chosen-outcome">
                <div className="outcome-label">Chosen Roll</div>
                <div className="individual-results">
                  {results.filter(r => !r.isModifier && !r.isDiscarded).map((result, index) => {
                    const critType = isCrit(result);
                    const sign = result.sign !== undefined ? result.sign : 1;
                    return (
                      <div 
                        key={index} 
                        className={`result-item ${critType ? `crit-${critType}` : ''} ${sign === -1 ? 'negative' : ''}`}
                      >
                        <span className="die-type">
                          {sign === -1 && '-'}d{result.sides}
                        </span>
                        <span className="die-result">{result.value}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="total-result chosen-total">
                  {hasModifier && modifier !== 0 && (
                    <div className="modifier-display">
                      {modifier > 0 ? '+' : ''}{modifier}
                    </div>
                  )}
                  <strong>Total: {total}</strong>
                </div>
              </div>
              <div className="advantage-outcome discarded-outcome">
                <div className="outcome-label">Discarded Roll</div>
                <div className="individual-results">
                  {results.filter(r => !r.isModifier && r.isDiscarded).map((result, index) => {
                    const critType = isCrit(result);
                    const sign = result.sign !== undefined ? result.sign : 1;
                    return (
                      <div 
                        key={index} 
                        className={`result-item discarded ${critType ? `crit-${critType}` : ''} ${sign === -1 ? 'negative' : ''}`}
                      >
                        <span className="die-type">
                          {sign === -1 && '-'}d{result.sides}
                        </span>
                        <span className="die-result">{result.value}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="total-result discarded-total">
                  {hasModifier && modifier !== 0 && (
                    <div className="modifier-display">
                      {modifier > 0 ? '+' : ''}{modifier}
                    </div>
                  )}
                  <strong>Total: {alternateTotal}</strong>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="individual-results">
                {results.filter(r => !r.isModifier).map((result, index) => {
                  const critType = isCrit(result);
                  const sign = result.sign !== undefined ? result.sign : 1;
                  return (
                    <div 
                      key={index} 
                      className={`result-item ${critType ? `crit-${critType}` : ''} ${sign === -1 ? 'negative' : ''}`}
                    >
                      <span className="die-type">
                        {sign === -1 && '-'}d{result.sides}
                      </span>
                      <span className="die-result">{result.value}</span>
                    </div>
                  );
                })}
              </div>
              <div className="total-result">
                {hasModifier && modifier !== 0 && (
                  <div className="modifier-display">
                    {modifier > 0 ? '+' : ''}{modifier}
                  </div>
                )}
                <strong>Total: {total}</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceRoller;
