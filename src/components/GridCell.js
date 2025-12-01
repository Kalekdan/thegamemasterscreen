import React from 'react';
import './GridCell.css';
import DiceRoller from './dice-roller/DiceRoller';
import Notes from './notes/Notes';
import Timer from './timer/Timer';
import Clock from './clock/Clock';
import Checklist from './checklist/Checklist';
import Monsters from './monsters/Monsters';
import Spells from './spells/Spells';
import MagicItems from './magic-items/MagicItems';
import Equipment from './equipment/Equipment';
import Conditions from './conditions/Conditions';
import WebPageEmbed from './webpage-embed/WebPageEmbed';
import InitiativeTracker from './initiative-tracker/InitiativeTracker';

const GridCell = ({ 
  componentKey,
  componentType,
  onCellClick, 
  cellId,
  rows,
  cols,
  onDeleteComponent, 
  colSpan, 
  rowSpan, 
  canExpandRight,
  canExpandDown,
  canExpandLeft,
  canExpandUp,
  canShrinkRight,
  canShrinkDown,
  canShrinkLeft,
  canShrinkUp,
  onCellResize,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
  draggedCellId,
  hoveredCellId,
  isInDropTargetArea,
  onDragEnter,
  onDragLeave,
  setGlobalDiceResult,
  hideTitles,
  initiativeTrackerRefs,
  registerInitiativeTracker,
  unregisterInitiativeTracker,
  componentInstances
}) => {
  const handleClick = () => {
    if (!componentKey) {
      onCellClick(cellId);
    }
  };

  const renderComponent = () => {
    if (!componentKey || !componentType) return null;
    
    const commonProps = {
      onDragStart: handleDragStart,
      onDragEnd: onDragEnd,
      setGlobalDiceResult,
      hideTitles,
      componentKey
    };
    
    if (componentType === 'dice-roller') {
      return <DiceRoller key={componentKey} {...commonProps} />;
    } else if (componentType === 'notes') {
      return <Notes key={componentKey} {...commonProps} />;
    } else if (componentType === 'timer') {
      return <Timer key={componentKey} {...commonProps} />;
    } else if (componentType === 'clock') {
      return <Clock key={componentKey} {...commonProps} />;
    } else if (componentType === 'checklist') {
      return <Checklist key={componentKey} {...commonProps} />;
    } else if (componentType === 'monsters') {
      return <Monsters key={componentKey} {...commonProps} initiativeTrackerRefs={initiativeTrackerRefs} />;
    } else if (componentType === 'spells') {
      return <Spells key={componentKey} {...commonProps} />;
    } else if (componentType === 'magic-items') {
      return <MagicItems key={componentKey} {...commonProps} />;
    } else if (componentType === 'equipment') {
      return <Equipment key={componentKey} {...commonProps} />;
    } else if (componentType === 'conditions') {
      return <Conditions key={componentKey} {...commonProps} />;
    } else if (componentType === 'webpage-embed') {
      return <WebPageEmbed key={componentKey} {...commonProps} />;
    } else if (componentType === 'initiative-tracker') {
      const defaultName = componentInstances && componentInstances[componentKey]?.defaultName;
      return <InitiativeTracker key={componentKey} {...commonProps} registerInitiativeTracker={registerInitiativeTracker} unregisterInitiativeTracker={unregisterInitiativeTracker} defaultName={defaultName} />;
    }
    return null;
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    onDragStart(cellId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(cellId);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteComponent(cellId);
  };

  const handleResize = (e, direction) => {
    e.stopPropagation();
    let newColSpan = colSpan;
    let newRowSpan = rowSpan;
    let newCellId = cellId;
    
    const row = Math.floor(cellId / cols);
    const col = cellId % cols;
    
    if (direction === 'expand-right') newColSpan += 1;
    if (direction === 'shrink-right') newColSpan -= 1;
    if (direction === 'expand-down') newRowSpan += 1;
    if (direction === 'shrink-down') newRowSpan -= 1;
    if (direction === 'expand-left') {
      newColSpan += 1;
      newCellId = row * cols + (col - 1);
    }
    if (direction === 'shrink-left') {
      newColSpan -= 1;
      newCellId = row * cols + (col + 1);
    }
    if (direction === 'expand-up') {
      newRowSpan += 1;
      newCellId = (row - 1) * cols + col;
    }
    if (direction === 'shrink-up') {
      newRowSpan -= 1;
      newCellId = (row + 1) * cols + col;
    }
    
    onCellResize(cellId, newColSpan, newRowSpan, newCellId);
  };

  const cellStyle = {
    gridColumn: `span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
  };

  const handleDragOverWithHighlight = (e) => {
    handleDragOver(e);
    if (!componentKey && draggedCellId !== null) {
      onDragEnter(cellId);
    }
  };

  const handleDragLeaveLocal = () => {
    if (onDragLeave) {
      onDragLeave();
    }
  };

  const handleDropWithCleanup = (e) => {
    handleDrop(e);
  };

  const isInTargetArea = hoveredCellId !== null && isInDropTargetArea && isInDropTargetArea(cellId, hoveredCellId);

  return (
    <div 
      className={`grid-cell ${componentKey ? 'has-component' : ''} ${isDragging ? 'dragging' : ''} ${isInTargetArea ? 'drop-target' : ''}`} 
      style={cellStyle} 
      onClick={handleClick}
      onDragOver={handleDragOverWithHighlight}
      onDragLeave={handleDragLeaveLocal}
      onDrop={handleDropWithCleanup}
    >
      {componentKey ? (
        <>
          {renderComponent()}
          <div className="cell-controls">
            <button className="delete-button" onClick={handleDelete}>
              ×
            </button>
          </div>
          
          {/* Left edge resize handle */}
          <div className="resize-edge left-edge">
            {canExpandLeft && (
              <button 
                className="edge-resize-button expand" 
                onClick={(e) => handleResize(e, 'expand-left')}
                title="Expand left"
              >
                ◀
              </button>
            )}
            {canShrinkLeft && (
              <button 
                className="edge-resize-button shrink" 
                onClick={(e) => handleResize(e, 'shrink-left')}
                title="Shrink from left"
              >
                ▶
              </button>
            )}
          </div>
          
          {/* Right edge resize handle */}
          <div className="resize-edge right-edge">
            {canExpandRight && (
              <button 
                className="edge-resize-button expand" 
                onClick={(e) => handleResize(e, 'expand-right')}
                title="Expand right"
              >
                ▶
              </button>
            )}
            {canShrinkRight && (
              <button 
                className="edge-resize-button shrink" 
                onClick={(e) => handleResize(e, 'shrink-right')}
                title="Shrink from right"
              >
                ◀
              </button>
            )}
          </div>
          
          {/* Top edge resize handle */}
          <div className="resize-edge top-edge">
            {canExpandUp && (
              <button 
                className="edge-resize-button expand" 
                onClick={(e) => handleResize(e, 'expand-up')}
                title="Expand up"
              >
                ▲
              </button>
            )}
            {canShrinkUp && (
              <button 
                className="edge-resize-button shrink" 
                onClick={(e) => handleResize(e, 'shrink-up')}
                title="Shrink from top"
              >
                ▼
              </button>
            )}
          </div>
          
          {/* Bottom edge resize handle */}
          <div className="resize-edge bottom-edge">
            {canExpandDown && (
              <button 
                className="edge-resize-button expand" 
                onClick={(e) => handleResize(e, 'expand-down')}
                title="Expand down"
              >
                ▼
              </button>
            )}
            {canShrinkDown && (
              <button 
                className="edge-resize-button shrink" 
                onClick={(e) => handleResize(e, 'shrink-down')}
                title="Shrink from bottom"
              >
                ▲
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="empty-cell">
          <span>+</span>
        </div>
      )}
    </div>
  );
};

export default GridCell;
