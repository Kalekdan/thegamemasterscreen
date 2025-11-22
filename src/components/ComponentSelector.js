import React from 'react';
import './ComponentSelector.css';

const ComponentSelector = ({ onSelect, onClose }) => {
  const componentGroups = [
    {
      title: 'Utilities',
      components: [
        { id: 'dice-roller', name: 'Dice Roller', icon: '🎲' },
        { id: 'notes', name: 'Notes', icon: '📝' },
        { id: 'timer', name: 'Timer', icon: '⏱️' },
        { id: 'webpage-embed', name: 'Web Page Embed', icon: '🌐', disabled: true },
        { id: 'name-generator', name: 'Name Generator', icon: '📛', disabled: true },
        { id: 'coin-converter', name: 'Coin Converter', icon: '💰', disabled: true },
        { id: 'initiative-tracker', name: 'Initiative Tracker', icon: '🎯', disabled: true },
      ]
    },
    {
      title: 'D&D 2024 Edition Rules',
      components: [
        { id: 'monsters', name: 'Monsters', icon: '🐉' },
        { id: 'spells', name: 'Spells', icon: '✨' },
        { id: 'equipment', name: 'Equipment', icon: '⚔️' },
        { id: 'magic-items', name: 'Magic Items', icon: '💎' },
        { id: 'conditions', name: 'Conditions', icon: '💀' },
      ]
    }
  ];

  return (
    <div className="selector-overlay" onClick={onClose}>
      <div className="selector-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Select Component</h3>
        <div className="component-list">
          {componentGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="component-group">
              <div className="group-title">{group.title}</div>
              <div className="group-components">
                {group.components.map((comp) => (
                  <button
                    key={comp.id}
                    className={`component-option ${comp.disabled ? 'disabled' : ''}`}
                    onClick={() => !comp.disabled && onSelect(comp.id)}
                    disabled={comp.disabled}
                  >
                    <span className="component-icon">{comp.icon}</span>
                    <span className="component-name">{comp.name}</span>
                    {comp.disabled && <span className="coming-soon">(Coming Soon)</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="close-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ComponentSelector;
