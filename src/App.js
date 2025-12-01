import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import './themes.css';
import DMGrid from './components/DMGrid';
import ComponentSelector from './components/ComponentSelector';
import DiceResultOverlay from './components/shared/DiceResultOverlay';
import Settings from './components/shared/Settings';
import ScreenManager from './components/shared/ScreenManager';
import { saveComponentState } from './utils/screenStorage';

function App() {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(4);
  const [cells, setCells] = useState({});
  const [cellSpans, setCellSpans] = useState({}); // { cellId: { colSpan, rowSpan } }
  const [selectedCellId, setSelectedCellId] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [componentInstances, setComponentInstances] = useState({}); // Store component types and keys
  const [globalDiceResult, setGlobalDiceResult] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenClose, setShowFullscreenClose] = useState(false);
  const [initiativeTrackerRefs, setInitiativeTrackerRefs] = useState({}); // Store refs to initiative tracker methods
  const initiativeTrackerCounterRef = useRef(1); // Counter for naming initiative trackers
  const [showSettings, setShowSettings] = useState(false);
  const [showScreenManager, setShowScreenManager] = useState(false);
  const [settings, setSettings] = useState({
    rows: 2,
    columns: 4,
    diceOverlay: true,
    diceOverlayDuration: 3000,
    hideTitles: false,
    theme: 'dark'
  });
  const diceTimeoutRef = useRef(null);

  const handleSetGlobalDiceResult = useCallback((result) => {
    if (!settings.diceOverlay) {
      setGlobalDiceResult(null);
      return;
    }

    // Clear any existing timeout
    if (diceTimeoutRef.current) {
      clearTimeout(diceTimeoutRef.current);
      diceTimeoutRef.current = null;
    }

    setGlobalDiceResult(result);

    // Set new timeout if result is not null
    if (result) {
      diceTimeoutRef.current = setTimeout(() => {
        setGlobalDiceResult(null);
        diceTimeoutRef.current = null;
      }, settings.diceOverlayDuration);
    }
  }, [settings.diceOverlay, settings.diceOverlayDuration]);

  const registerInitiativeTracker = useCallback((componentKey, methods, trackerName) => {
    setInitiativeTrackerRefs(prev => ({
      ...prev,
      [componentKey]: { ...methods, name: trackerName }
    }));
  }, []);

  const unregisterInitiativeTracker = useCallback((componentKey) => {
    setInitiativeTrackerRefs(prev => {
      const newRefs = { ...prev };
      delete newRefs[componentKey];
      return newRefs;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Keyboard shortcut for fullscreen (Escape key)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Exit fullscreen with Escape key
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  // Show close button when hovering near top-right in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (e) => {
      // Show button if mouse is within 100px of top and 100px of right edge
      const nearTop = e.clientY < 100;
      const nearRight = window.innerWidth - e.clientX < 100;
      setShowFullscreenClose(nearTop && nearRight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen]);

  const handleCellClick = useCallback((cellId) => {
    setSelectedCellId(cellId);
    setShowSelector(true);
  }, []);

  const handleComponentSelect = useCallback((componentId) => {
    // Create a unique key for this component instance
    const componentKey = `${componentId}-${Date.now()}`;
    
    setCells(prevCells => ({
      ...prevCells,
      [selectedCellId]: componentKey,
    }));
    
    const instanceData = { type: componentId };
    
    // If this is an initiative tracker, assign a default name
    if (componentId === 'initiative-tracker') {
      instanceData.defaultName = `Initiative Tracker ${initiativeTrackerCounterRef.current}`;
      initiativeTrackerCounterRef.current += 1;
    }
    
    setComponentInstances(prevInstances => ({
      ...prevInstances,
      [componentKey]: instanceData
    }));
    
    // Initialize span to 1x1 if not already set
    setCellSpans(prevSpans => {
      if (!prevSpans[selectedCellId]) {
        return {
          ...prevSpans,
          [selectedCellId]: { colSpan: 1, rowSpan: 1 }
        };
      }
      return prevSpans;
    });
    
    setShowSelector(false);
    setSelectedCellId(null);
  }, [selectedCellId]);

  const handleDeleteComponent = (cellId) => {
    const componentKey = cells[cellId];
    const newCells = { ...cells };
    delete newCells[cellId];
    setCells(newCells);
    const newSpans = { ...cellSpans };
    delete newSpans[cellId];
    setCellSpans(newSpans);
    
    // Clean up component instance
    if (componentKey) {
      const newInstances = { ...componentInstances };
      delete newInstances[componentKey];
      setComponentInstances(newInstances);
    }
  };

  const handleCellResize = (cellId, colSpan, rowSpan, newCellId) => {
    // If newCellId is different, we need to move the component
    if (newCellId !== undefined && newCellId !== cellId) {
      const newCells = { ...cells };
      const newSpans = { ...cellSpans };
      
      // Move component to new position
      newCells[newCellId] = cells[cellId];
      delete newCells[cellId];
      
      // Update spans
      newSpans[newCellId] = { colSpan, rowSpan };
      delete newSpans[cellId];
      
      setCells(newCells);
      setCellSpans(newSpans);
    } else {
      setCellSpans({
        ...cellSpans,
        [cellId]: { colSpan, rowSpan }
      });
    }
  };

  const handleComponentMove = (fromCellId, toCellId) => {
    // Don't move if target cell already has a component
    if (cells[toCellId]) {
      return false;
    }

    const span = cellSpans[fromCellId] || { colSpan: 1, rowSpan: 1 };
    const targetRow = Math.floor(toCellId / cols);
    const targetCol = toCellId % cols;

    // Check if component would fit at target location
    if (targetCol + span.colSpan > cols || targetRow + span.rowSpan > rows) {
      return false;
    }

    // Check if any cells in the span are occupied
    for (let r = 0; r < span.rowSpan; r++) {
      for (let c = 0; c < span.colSpan; c++) {
        const checkCellId = (targetRow + r) * cols + (targetCol + c);
        if (cells[checkCellId] && checkCellId !== fromCellId) {
          return false;
        }
      }
    }

    // Move the component
    const newCells = { ...cells };
    const newSpans = { ...cellSpans };
    
    newCells[toCellId] = cells[fromCellId];
    delete newCells[fromCellId];
    
    newSpans[toCellId] = span;
    delete newSpans[fromCellId];
    
    setCells(newCells);
    setCellSpans(newSpans);
    return true;
  };

  const handleCloseSelector = () => {
    setShowSelector(false);
    setSelectedCellId(null);
  };

  // Check if reducing rows would affect any components
  const canReduceRows = useCallback((newRows) => {
    if (newRows >= rows) return true; // Can always increase
    
    // Check if any component would be cut off
    for (const [cellId, component] of Object.entries(cells)) {
      if (!component) continue;
      const cellIndex = parseInt(cellId);
      const row = Math.floor(cellIndex / cols);
      const span = cellSpans[cellId] || { rowSpan: 1 };
      
      // Check if component extends beyond new row count
      if (row >= newRows || row + span.rowSpan > newRows) {
        return false;
      }
    }
    return true;
  }, [rows, cols, cells, cellSpans]);

  // Check if reducing columns would affect any components
  const canReduceCols = useCallback((newCols) => {
    if (newCols >= cols) return true; // Can always increase
    
    // Check if any component would be cut off
    for (const [cellId, component] of Object.entries(cells)) {
      if (!component) continue;
      const cellIndex = parseInt(cellId);
      const col = cellIndex % cols;
      const span = cellSpans[cellId] || { colSpan: 1 };
      
      // Check if component extends beyond new column count
      if (col >= newCols || col + span.colSpan > newCols) {
        return false;
      }
    }
    return true;
  }, [cols, cells, cellSpans]);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const handleRowsChange = useCallback((newRows) => {
    if (!canReduceRows(newRows)) {
      return; // Prevent change if it would affect components
    }
    
    setRows(newRows);
    setSettings(prev => ({ ...prev, rows: newRows }));
    // Clean up cells that are now out of bounds
    const newCells = {};
    const newSpans = {};
    Object.keys(cells).forEach((cellId) => {
      if (parseInt(cellId) < newRows * cols) {
        newCells[cellId] = cells[cellId];
        if (cellSpans[cellId]) {
          newSpans[cellId] = cellSpans[cellId];
        }
      }
    });
    setCells(newCells);
    setCellSpans(newSpans);
  }, [cells, cellSpans, cols, canReduceRows]);

  const handleColsChange = useCallback((newCols) => {
    if (!canReduceCols(newCols)) {
      return; // Prevent change if it would affect components
    }
    
    setCols(newCols);
    setSettings(prev => ({ ...prev, columns: newCols }));
    // Clean up cells that are now out of bounds
    const newCells = {};
    const newSpans = {};
    Object.keys(cells).forEach((cellId) => {
      if (parseInt(cellId) < rows * newCols) {
        newCells[cellId] = cells[cellId];
        if (cellSpans[cellId]) {
          newSpans[cellId] = cellSpans[cellId];
        }
      }
    });
    setCells(newCells);
    setCellSpans(newSpans);
  }, [cells, cellSpans, rows, canReduceCols]);

  // Sync rows and cols with settings
  useEffect(() => {
    if (settings.rows !== rows) {
      handleRowsChange(settings.rows);
    }
    if (settings.columns !== cols) {
      handleColsChange(settings.columns);
    }
  }, [settings.rows, settings.columns, rows, cols, handleRowsChange, handleColsChange]);

  const handleLoadScreen = useCallback((screenData) => {
    // Apply settings
    const newSettings = {
      ...settings,
      rows: screenData.settings.rows,
      columns: screenData.settings.columns,
      theme: screenData.settings.theme,
      diceOverlay: screenData.settings.diceOverlay,
      diceOverlayDuration: screenData.settings.diceOverlayDuration,
      hideTitles: screenData.settings.hideTitles
    };
    setSettings(newSettings);
    setRows(screenData.settings.rows);
    setCols(screenData.settings.columns);

    // Restore components
    const newCells = {};
    const newCellSpans = {};
    const newComponentInstances = {};

    // First pass: create component keys and save state to localStorage BEFORE rendering
    screenData.components.forEach((component, index) => {
      // Create unique component key with index to ensure uniqueness
      const componentKey = `${component.componentType}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      
      newCells[component.cellId] = componentKey;
      newCellSpans[component.cellId] = {
        colSpan: component.colSpan,
        rowSpan: component.rowSpan
      };
      newComponentInstances[componentKey] = {
        type: component.componentType
      };

      // Restore component state to localStorage BEFORE React renders the component
      if (component.state && Object.keys(component.state).length > 0) {
        saveComponentState(componentKey, component.state);
      }
    });

    // Now update React state to trigger component rendering
    // Components will find their state already in localStorage
    setCells(newCells);
    setCellSpans(newCellSpans);
    setComponentInstances(newComponentInstances);
  }, [settings]);

  const getCurrentScreenConfig = useCallback(() => {
    return {
      rows,
      cols,
      cells,
      cellSpans,
      componentInstances,
      settings
    };
  }, [rows, cols, cells, cellSpans, componentInstances, settings]);

  return (
    <div 
      className={`App theme-${settings.theme} ${isFullscreen ? 'fullscreen-mode' : ''} ${settings.hideTitles ? 'hide-titles' : ''}`}
    >
      {!isFullscreen && (
        <header className="App-header">
          <div className="header-content">
            <div>
              <h1>🎲 The Gamemaster Screen</h1>
              <p>Click on any grid cell to add a component</p>
            </div>
            <div className="header-controls">
              <button 
                className="save-load-btn"
                onClick={() => setShowScreenManager(true)}
                title="Save/Load Screens"
              >
                💾
              </button>
              <button 
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                ⚙️
              </button>
              <button 
                className="fullscreen-toggle-btn"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen (Esc to exit)"
              >
                ⛶
              </button>
            </div>
          </div>
        </header>
      )}
      <DMGrid
        rows={rows}
        cols={cols}
        cells={cells}
        cellSpans={cellSpans}
        componentInstances={componentInstances}
        onCellClick={handleCellClick}
        onDeleteComponent={handleDeleteComponent}
        onCellResize={handleCellResize}
        onComponentMove={handleComponentMove}
        globalDiceResult={globalDiceResult}
        setGlobalDiceResult={handleSetGlobalDiceResult}
        hideTitles={settings.hideTitles}
        initiativeTrackerRefs={initiativeTrackerRefs}
        registerInitiativeTracker={registerInitiativeTracker}
        unregisterInitiativeTracker={unregisterInitiativeTracker}
      />
      {showSelector && (
        <ComponentSelector
          onSelect={handleComponentSelect}
          onClose={handleCloseSelector}
        />
      )}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
      <ScreenManager
        isOpen={showScreenManager}
        onClose={() => setShowScreenManager(false)}
        onLoadScreen={handleLoadScreen}
        currentScreenConfig={getCurrentScreenConfig()}
      />
      {settings.diceOverlay && <DiceResultOverlay diceResult={globalDiceResult} />}
      {isFullscreen && showFullscreenClose && (
        <button 
          className="fullscreen-close-btn"
          onClick={toggleFullscreen}
          title="Exit Fullscreen (Esc)"
        >
          ✕
        </button>
      )}
      {!isFullscreen && (
        <footer className="App-footer">
          <div className="footer-content">
            <p className="made-by">Made by <a href="https://joerickard.co.uk" target="_blank" rel="noopener noreferrer">Joe Rickard</a></p>
            <a href="https://www.buymeacoffee.com/joerickard" target="_blank" rel="noopener noreferrer" className="bmc-button">
              ☕ Buy me a coffee
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
