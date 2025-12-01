import React from 'react';
import GridCell from './GridCell';
import './DMGrid.css';

const DMGrid = ({ rows, cols, cells, cellSpans, componentInstances, onCellClick, onDeleteComponent, onCellResize, onComponentMove, globalDiceResult, setGlobalDiceResult, hideTitles, initiativeTrackerRefs, registerInitiativeTracker, unregisterInitiativeTracker }) => {
  const [draggedCellId, setDraggedCellId] = React.useState(null);
  const [hoveredCellId, setHoveredCellId] = React.useState(null);

  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  const handleDragStart = (cellId) => {
    setDraggedCellId(cellId);
  };

  const handleDragEnd = () => {
    setDraggedCellId(null);
    setHoveredCellId(null);
  };

  const handleDrop = (targetCellId) => {
    if (draggedCellId !== null && draggedCellId !== targetCellId) {
      onComponentMove(draggedCellId, targetCellId);
    }
    setDraggedCellId(null);
    setHoveredCellId(null);
  };

  const handleDragEnter = (cellId) => {
    if (draggedCellId !== null && !cells[cellId]) {
      setHoveredCellId(cellId);
    }
  };

  const handleDragLeave = () => {
    // Don't clear immediately as we might be moving to another cell
  };

  // Check if a cell would be covered by dragging a component to a target location
  const isInDropTargetArea = (cellId, targetCellId) => {
    if (draggedCellId === null) return false;
    
    const draggedSpan = cellSpans[draggedCellId] || { colSpan: 1, rowSpan: 1 };
    const targetRow = Math.floor(targetCellId / cols);
    const targetCol = targetCellId % cols;
    const cellRow = Math.floor(cellId / cols);
    const cellCol = cellId % cols;
    
    return cellRow >= targetRow && 
           cellRow < targetRow + draggedSpan.rowSpan &&
           cellCol >= targetCol && 
           cellCol < targetCol + draggedSpan.colSpan;
  };

  // Helper to check if a cell is covered by a spanning cell
  const isCellCovered = (cellIndex) => {
    for (let i = 0; i < cellIndex; i++) {
      const span = cellSpans[i];
      if (span && cells[i]) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const targetRow = Math.floor(cellIndex / cols);
        const targetCol = cellIndex % cols;
        
        // Check if this cell is within the span of cell i
        if (targetRow >= row && targetRow < row + span.rowSpan &&
            targetCol >= col && targetCol < col + span.colSpan) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper to check if expansion would collide with another component
  const canExpand = (cellId, direction, amount) => {
    const currentSpan = cellSpans[cellId] || { colSpan: 1, rowSpan: 1 };
    const row = Math.floor(cellId / cols);
    const col = cellId % cols;
    
    let newColSpan = currentSpan.colSpan;
    let newRowSpan = currentSpan.rowSpan;
    let startRow = row;
    let startCol = col;
    
    if (direction === 'right') newColSpan += amount;
    if (direction === 'left') {
      newColSpan += amount;
      startCol -= amount;
    }
    if (direction === 'down') newRowSpan += amount;
    if (direction === 'up') {
      newRowSpan += amount;
      startRow -= amount;
    }
    
    // Check if expansion would go out of bounds
    if (startCol < 0 || startRow < 0 || startCol + newColSpan > cols || startRow + newRowSpan > rows) {
      return false;
    }
    
    // Check all cells that would be covered by the expansion
    for (let r = startRow; r < startRow + newRowSpan; r++) {
      for (let c = startCol; c < startCol + newColSpan; c++) {
        const targetIndex = r * cols + c;
        // Skip cells currently covered by this component
        const isCoveredByCurrent = r >= row && r < row + currentSpan.rowSpan &&
                                    c >= col && c < col + currentSpan.colSpan;
        if (isCoveredByCurrent) continue;
        
        // Check if this cell has a component or is covered by another spanning cell
        if (cells[targetIndex]) {
          return false;
        }
        
        // Check if covered by another cell's span
        for (let i = 0; i < rows * cols; i++) {
          if (i === cellId || !cells[i]) continue;
          const span = cellSpans[i] || { colSpan: 1, rowSpan: 1 };
          const spanRow = Math.floor(i / cols);
          const spanCol = i % cols;
          
          if (r >= spanRow && r < spanRow + span.rowSpan &&
              c >= spanCol && c < spanCol + span.colSpan) {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const renderCells = () => {
    const cellElements = [];
    for (let i = 0; i < rows * cols; i++) {
      // Skip cells that are covered by spanning cells
      if (isCellCovered(i)) {
        continue;
      }

      const span = cellSpans[i] || { colSpan: 1, rowSpan: 1 };
      
      cellElements.push(
        <GridCell
          key={cells[i] || `cell-${i}`}
          cellId={i}
          rows={rows}
          cols={cols}
          componentKey={cells[i]}
          componentType={cells[i] && componentInstances[cells[i]] ? componentInstances[cells[i]].type : null}
          colSpan={span.colSpan}
          rowSpan={span.rowSpan}
          maxColSpan={cols - (i % cols)}
          maxRowSpan={rows - Math.floor(i / cols)}
          canExpandRight={cells[i] && canExpand(i, 'right', 1)}
          canExpandDown={cells[i] && canExpand(i, 'down', 1)}
          canExpandLeft={cells[i] && canExpand(i, 'left', 1)}
          canExpandUp={cells[i] && canExpand(i, 'up', 1)}
          canShrinkRight={span.colSpan > 1}
          canShrinkDown={span.rowSpan > 1}
          canShrinkLeft={span.colSpan > 1}
          canShrinkUp={span.rowSpan > 1}
          onCellClick={onCellClick}
          onDeleteComponent={onDeleteComponent}
          onCellResize={onCellResize}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          isDragging={draggedCellId === i}
          draggedCellId={draggedCellId}
          hoveredCellId={hoveredCellId}
          isInDropTargetArea={isInDropTargetArea}
          setGlobalDiceResult={setGlobalDiceResult}
          hideTitles={hideTitles}
          initiativeTrackerRefs={initiativeTrackerRefs}
          registerInitiativeTracker={registerInitiativeTracker}
          unregisterInitiativeTracker={unregisterInitiativeTracker}
          componentInstances={componentInstances}
        />
      );
    }
    return cellElements;
  };

  return (
    <div className="dm-grid" style={gridStyle}>
      {renderCells()}
    </div>
  );
};

export default DMGrid;
