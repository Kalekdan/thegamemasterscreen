import React, { useState, useEffect } from 'react';
import './WebPageEmbed.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const WebPageEmbed = ({ onDragStart, onDragEnd, componentKey }) => {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [zoom, setZoom] = useState(100);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.url !== undefined) setUrl(savedState.url);
        if (savedState.currentUrl !== undefined) setCurrentUrl(savedState.currentUrl);
        if (savedState.zoom !== undefined) setZoom(savedState.zoom);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when it changes
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        url,
        currentUrl,
        zoom
      });
    }
  }, [componentKey, url, currentUrl, zoom, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  const handleLoadUrl = () => {
    if (url.trim()) {
      // Ensure URL has a protocol
      let formattedUrl = url.trim();
      if (!formattedUrl.match(/^https?:\/\//i)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      setCurrentUrl(formattedUrl);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLoadUrl();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleExampleClick = (exampleUrl) => {
    setUrl(exampleUrl);
    setCurrentUrl(exampleUrl);
  };

  return (
    <div className="webpage-embed">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>🌐 Web Page Embed</h3>

      <div className="embed-controls">
        <div className="url-input-group">
          <input
            type="text"
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="url-input"
          />
          <button onClick={handleLoadUrl} className="load-button">
            Go
          </button>
          {currentUrl && (
            <button 
              onClick={() => setControlsExpanded(!controlsExpanded)} 
              className="toggle-controls-btn"
              title={controlsExpanded ? "Hide controls" : "Show controls"}
            >
              {controlsExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>

        {currentUrl && controlsExpanded && (
          <div className="frame-controls">
            <span className="zoom-label">Zoom:</span>
            <button onClick={handleZoomOut} className="control-btn" title="Zoom Out">−</button>
            <span className="zoom-value">{zoom}%</span>
            <button onClick={handleZoomIn} className="control-btn" title="Zoom In">+</button>
            <button onClick={handleResetZoom} className="control-btn-secondary" title="Reset Zoom">Reset</button>
          </div>
        )}
      </div>

      <div className="iframe-container">
        {currentUrl ? (
          <div className="iframe-wrapper">
            <iframe
              src={currentUrl}
              title="Embedded Web Page"
              className="embedded-iframe"
              style={{
                zoom: `${zoom}%`
              }}
            />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p>Enter a URL above to embed a web page</p>
            <div className="example-urls">
              <small>Examples:</small>
              <div className="example-list">
                <button onClick={() => handleExampleClick('https://thievesguild.cc/shops/shop-potion.php')} className="example-btn">
                  Theives Guild Potion Shop
                </button>
                <button onClick={() => handleExampleClick('https://5e.tools/conditionsdiseases.html')} className="example-btn">
                  Conditions
                </button>
                <button onClick={() => handleExampleClick('https://donjon.bin.sh/5e/random/#type=treasure')} className="example-btn">
                  Donjon Magic Item Generator
                </button>
                <button onClick={() => handleExampleClick('https://gamenightblog.com/wp-content/uploads/2019/04/phandelver-map-exterior-dm.jpg')} className="example-btn">
                  Phandelver Map
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPageEmbed;
