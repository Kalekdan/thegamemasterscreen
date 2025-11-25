import React from 'react';
import './ComponentSelector.css';

const ComponentSelector = ({ onSelect, onClose }) => {
  const componentGroups = [
    {
      title: 'Combat & Initiative',
      components: [
        { id: 'initiative-tracker', name: 'Initiative Tracker', icon: '🎯' },
        { id: 'dice-roller', name: 'Dice Roller', icon: '🎲' },
      ]
    },
    {
      title: 'Time Tracking',
      components: [
        { id: 'timer', name: 'Countdown Timer', icon: '⏱️' },
        { id: 'clock', name: 'Elapsed Time', icon: '🕐' },
      ]
    },
    {
      title: 'Notes & Planning',
      components: [
        { id: 'notes', name: 'Notes', icon: '📝' },
        { id: 'checklist', name: 'Checklist', icon: '✓' },
      ]
    },
    {
      title: 'D&D 2024 Rules Reference',
      components: [
        { id: 'monsters', name: 'Monsters', icon: '🐉' },
        { id: 'spells', name: 'Spells', icon: '✨' },
        { id: 'equipment', name: 'Equipment', icon: '⚔️' },
        { id: 'magic-items', name: 'Magic Items', icon: '💎' },
        { id: 'conditions', name: 'Conditions', icon: '💀' },
      ]
    },
    {
      title: 'Other Tools',
      components: [
        { id: 'webpage-embed', name: 'Web Page', icon: '🌐' },
        { id: 'name-generator', name: 'Name Generator', icon: '📛', disabled: true },
        { id: 'coin-converter', name: 'Coin Converter', icon: '💰', disabled: true },
      ]
    }
  ];

  return (
    <div className="selector-overlay" onClick={onClose}>
      <div className="selector-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Component</h3>
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
                    {comp.disabled && <span className="coming-soon">(Soon)</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="selector-footer">
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSf6PwnXoDb5eNZ1BFDprXlqDOPFp5MGKyVmXgfi1sCWhvbULw/viewform?usp=dialog" 
            target="_blank" 
            rel="noopener noreferrer"
            className="suggest-feature-link"
          >
            💡 Suggest a Feature
          </a>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentSelector;
