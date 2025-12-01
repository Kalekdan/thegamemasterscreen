import React, { useState, useEffect } from 'react';
import './ScreenManager.css';
import {
  getScreensList,
  loadScreenFromStorage,
  saveScreenToStorage,
  deleteScreen,
  exportScreenToFile,
  importScreenFromFile,
  generateScreenId,
  createScreenSave
} from '../../utils/screenStorage';

const ScreenManager = ({ isOpen, onClose, onLoadScreen, currentScreenConfig }) => {
  const [screens, setScreens] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadScreensList();
    }
  }, [isOpen]);

  const loadScreensList = () => {
    const list = getScreensList();
    // Sort by modified date, most recent first
    list.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    setScreens(list);
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Please enter a name for this screen');
      return;
    }

    // Check for duplicate names (only when creating new or changing name)
    if (!selectedScreen || selectedScreen.name !== saveName.trim()) {
      const isDuplicate = screens.some(
        screen => screen.name.toLowerCase() === saveName.trim().toLowerCase() &&
                  screen.id !== selectedScreen?.id
      );
      
      if (isDuplicate) {
        alert('A screen with this name already exists. Please choose a different name.');
        return;
      }
    }

    const screenId = selectedScreen?.id || generateScreenId();
    const screenData = createScreenSave(saveName, currentScreenConfig);
    
    // Preserve original created date if updating
    if (selectedScreen) {
      screenData.created = selectedScreen.created;
    }

    const success = saveScreenToStorage(screenId, screenData);
    
    if (success) {
      setShowSaveDialog(false);
      setSaveName('');
      setSelectedScreen(null);
      loadScreensList();
    } else {
      alert('Failed to save screen');
    }
  };

  const handleLoad = (screenId) => {
    const screenData = loadScreenFromStorage(screenId);
    if (screenData) {
      onLoadScreen(screenData);
      onClose();
    } else {
      alert('Failed to load screen');
    }
  };

  const handleDelete = (screenId) => {
    const success = deleteScreen(screenId);
    if (success) {
      loadScreensList();
      setShowDeleteConfirm(null);
    } else {
      alert('Failed to delete screen');
    }
  };

  const handleExport = (screenId) => {
    const screenData = loadScreenFromStorage(screenId);
    if (screenData) {
      exportScreenToFile(screenData);
    } else {
      alert('Failed to export screen');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const screenData = await importScreenFromFile(file);
      const screenId = generateScreenId();
      
      const success = saveScreenToStorage(screenId, screenData);
      if (success) {
        loadScreensList();
        alert('Screen imported successfully!');
      } else {
        alert('Failed to save imported screen');
      }
    } catch (error) {
      alert(error.message || 'Failed to import screen');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleQuickSave = () => {
    const defaultName = `Screen ${new Date().toLocaleString()}`;
    setSaveName(defaultName);
    setSelectedScreen(null);
    setShowSaveDialog(true);
  };

  const handleUpdate = (screen) => {
    setSaveName(screen.name);
    setSelectedScreen(screen);
    setShowSaveDialog(true);
  };

  const handleOverwrite = (screen) => {
    if (window.confirm(`Overwrite "${screen.name}" with current screen?`)) {
      const screenData = createScreenSave(screen.name, currentScreenConfig);
      screenData.created = screen.created;
      const success = saveScreenToStorage(screen.id, screenData);
      
      if (success) {
        loadScreensList();
        alert('Screen overwritten successfully!');
      } else {
        alert('Failed to overwrite screen');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="screen-manager-overlay" onClick={onClose}>
      <div className="screen-manager-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Screen Manager</h2>
        
        <div className="screen-manager-actions">
          <button className="action-btn primary" onClick={handleQuickSave}>
            💾 Save Current Screen
          </button>
          <label className="action-btn secondary">
            📁 Import from File
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {showSaveDialog && (
          <div className="save-dialog">
            <h3>{selectedScreen ? 'Update Screen' : 'Save New Screen'}</h3>
            <input
              type="text"
              placeholder="Enter screen name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="dialog-actions">
              <button className="btn-primary" onClick={handleSave}>
                {selectedScreen ? 'Update' : 'Save'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName('');
                  setSelectedScreen(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="screens-list">
          <h3>Saved Screens ({screens.length})</h3>
          {screens.length === 0 ? (
            <p className="empty-message">No saved screens yet. Save your current screen to get started!</p>
          ) : (
            <div className="screens-grid">
              {screens.map((screen) => (
                <div key={screen.id} className="screen-card">
                  {showDeleteConfirm === screen.id && (
                    <div className="delete-confirm">
                      <p>Delete "{screen.name}"?</p>
                      <div className="confirm-actions">
                        <button 
                          className="btn-danger" 
                          onClick={() => handleDelete(screen.id)}
                        >
                          Delete
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showDeleteConfirm !== screen.id && (
                    <>
                      <div className="screen-info">
                        <h4>{screen.name}</h4>
                        <div className="screen-meta">
                          <span className="meta-date">
                            Modified: {formatDate(screen.modified)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="screen-actions">
                        <button 
                          className="action-icon-btn load" 
                          onClick={() => handleLoad(screen.id)}
                          title="Load Screen"
                        >
                          📂 Load
                        </button>
                        <button 
                          className="action-icon-btn overwrite" 
                          onClick={() => handleOverwrite(screen)}
                          title="Overwrite with Current Screen"
                        >
                          💾 Overwrite
                        </button>
                        <button 
                          className="action-icon-btn update" 
                          onClick={() => handleUpdate(screen)}
                          title="Rename Screen"
                        >
                          ✏️ Rename
                        </button>
                        <button 
                          className="action-icon-btn export" 
                          onClick={() => handleExport(screen.id)}
                          title="Export to File"
                        >
                          📤 Export
                        </button>
                        <button 
                          className="action-icon-btn delete" 
                          onClick={() => setShowDeleteConfirm(screen.id)}
                          title="Delete Screen"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ScreenManager;
