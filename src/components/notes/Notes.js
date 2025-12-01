import React, { useState, useEffect } from 'react';
import './Notes.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const Notes = ({ onDragStart, onDragEnd, componentKey }) => {
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [scale, setScale] = useState(100);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state on mount and when componentKey changes
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.content !== undefined) setContent(savedState.content);
        if (savedState.isPreview !== undefined) setIsPreview(savedState.isPreview);
        if (savedState.scale !== undefined) setScale(savedState.scale);
      }
      // Mark as initialized after loading
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when content, preview, or scale changes (but only after initialization)
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        content,
        isPreview,
        scale
      });
    }
  }, [componentKey, content, isPreview, scale, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  const increaseScale = () => {
    setScale(Math.min(scale + 10, 200));
  };

  const decreaseScale = () => {
    setScale(Math.max(scale - 10, 50));
  };

  const renderMarkdown = (text) => {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  return (
    <div className="notes">
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <div className="notes-header">
        <h3>📝 Notes</h3>
        <div className="notes-controls">
          <button 
            className={`toggle-button ${!isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(false)}
            title="Edit mode"
          >
            Edit
          </button>
          <button 
            className={`toggle-button ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(true)}
            title="Preview mode"
          >
            Preview
          </button>
          <div className="scale-controls">
            <button 
              className="scale-button"
              onClick={decreaseScale}
              disabled={scale <= 50}
              title="Decrease scale"
            >
              −
            </button>
            <span className="scale-value">{scale}%</span>
            <button 
              className="scale-button"
              onClick={increaseScale}
              disabled={scale >= 200}
              title="Increase scale"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div 
        className="notes-content" 
        style={{ fontSize: `${scale}%` }}
      >
        {!isPreview ? (
          <textarea
            className="notes-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your notes here...

Supports markdown:
# Heading 1
## Heading 2
### Heading 3
**bold text**
*italic text*
* list item"
          />
        ) : (
          <div 
            className="notes-preview"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </div>
  );
};

export default Notes;
