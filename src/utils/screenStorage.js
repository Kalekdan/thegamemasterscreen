/**
 * Screen Storage Utilities
 * Handles saving and loading DM screen configurations
 */

const STORAGE_KEY_PREFIX = 'gm-screen-';
const SCREENS_LIST_KEY = 'gm-screens-list';
const VERSION = '1.0';

/**
 * Get component state from localStorage if it exists
 * @param {string} componentKey - Unique component instance key
 * @returns {object|null} Component state or null
 */
export const getComponentState = (componentKey) => {
  try {
    const stateKey = `component-state-${componentKey}`;
    const stored = localStorage.getItem(stateKey);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading component state:', error);
    return null;
  }
};

/**
 * Save component state to localStorage
 * @param {string} componentKey - Unique component instance key
 * @param {object} state - Component state to save
 */
export const saveComponentState = (componentKey, state) => {
  try {
    const stateKey = `component-state-${componentKey}`;
    localStorage.setItem(stateKey, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving component state:', error);
  }
};

/**
 * Create a screen save object from current app state
 * @param {string} name - Name for this screen
 * @param {object} config - Screen configuration
 * @returns {object} Screen save data
 */
export const createScreenSave = (name, config) => {
  const {
    rows,
    cols,
    cells,
    cellSpans,
    componentInstances,
    settings
  } = config;

  const components = [];
  
  // Convert cells and spans into component array
  Object.entries(cells).forEach(([cellId, componentKey]) => {
    if (componentKey && componentInstances[componentKey]) {
      const span = cellSpans[cellId] || { colSpan: 1, rowSpan: 1 };
      const componentType = componentInstances[componentKey].type;
      
      // Get component-specific state from localStorage
      const state = getComponentState(componentKey);
      
      components.push({
        cellId: parseInt(cellId),
        componentType,
        colSpan: span.colSpan,
        rowSpan: span.rowSpan,
        state: state || {}
      });
    }
  });

  return {
    version: VERSION,
    name,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    settings: {
      rows,
      columns: cols,
      theme: settings.theme,
      diceOverlay: settings.diceOverlay,
      diceOverlayDuration: settings.diceOverlayDuration,
      hideTitles: settings.hideTitles
    },
    components
  };
};

/**
 * Save screen to localStorage
 * @param {string} screenId - Unique ID for this screen
 * @param {object} screenData - Screen save data
 */
export const saveScreenToStorage = (screenId, screenData) => {
  try {
    // Save the screen data
    const storageKey = STORAGE_KEY_PREFIX + screenId;
    localStorage.setItem(storageKey, JSON.stringify(screenData));
    
    // Update screens list
    const screensList = getScreensList();
    const existingIndex = screensList.findIndex(s => s.id === screenId);
    
    const listEntry = {
      id: screenId,
      name: screenData.name,
      modified: screenData.modified,
      created: screenData.created
    };
    
    if (existingIndex >= 0) {
      screensList[existingIndex] = listEntry;
    } else {
      screensList.push(listEntry);
    }
    
    localStorage.setItem(SCREENS_LIST_KEY, JSON.stringify(screensList));
    
    return true;
  } catch (error) {
    console.error('Error saving screen:', error);
    return false;
  }
};

/**
 * Load screen from localStorage
 * @param {string} screenId - Unique ID for the screen
 * @returns {object|null} Screen data or null
 */
export const loadScreenFromStorage = (screenId) => {
  try {
    const storageKey = STORAGE_KEY_PREFIX + screenId;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading screen:', error);
    return null;
  }
};

/**
 * Get list of all saved screens
 * @returns {Array} List of screen metadata
 */
export const getScreensList = () => {
  try {
    const stored = localStorage.getItem(SCREENS_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading screens list:', error);
    return [];
  }
};

/**
 * Delete screen from localStorage
 * @param {string} screenId - Unique ID for the screen
 */
export const deleteScreen = (screenId) => {
  try {
    // Delete screen data
    const storageKey = STORAGE_KEY_PREFIX + screenId;
    localStorage.removeItem(storageKey);
    
    // Update screens list
    const screensList = getScreensList();
    const filteredList = screensList.filter(s => s.id !== screenId);
    localStorage.setItem(SCREENS_LIST_KEY, JSON.stringify(filteredList));
    
    return true;
  } catch (error) {
    console.error('Error deleting screen:', error);
    return false;
  }
};

/**
 * Export screen data to JSON file
 * @param {object} screenData - Screen save data
 * @param {string} filename - Optional filename
 */
export const exportScreenToFile = (screenData, filename) => {
  try {
    const json = JSON.stringify(screenData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${screenData.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting screen:', error);
    return false;
  }
};

/**
 * Import screen data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<object>} Screen data
 */
export const importScreenFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const screenData = JSON.parse(e.target.result);
        
        // Validate required fields
        if (!screenData.version || !screenData.components || !screenData.settings) {
          reject(new Error('Invalid screen file format'));
          return;
        }
        
        // Update modified timestamp
        screenData.modified = new Date().toISOString();
        
        resolve(screenData);
      } catch (error) {
        reject(new Error('Failed to parse screen file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Generate unique screen ID
 * @returns {string} Unique ID
 */
export const generateScreenId = () => {
  return `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
