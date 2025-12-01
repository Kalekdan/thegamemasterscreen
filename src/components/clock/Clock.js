import React, { useState, useEffect, useRef } from 'react';
import './Clock.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const Clock = ({ onDragStart, onDragEnd, componentKey }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef(null);

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.elapsedTime !== undefined) setElapsedTime(savedState.elapsedTime);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when elapsed time changes
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        elapsedTime,
        isRunning: false // Don't restore as running
      });
    }
  }, [componentKey, elapsedTime, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  return (
    <div className="clock">
      <div
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
      >
        ⋮⋮
      </div>
      <h3>🕐 Elapsed Time</h3>
      
      <div className="clock-display">
        {formatTime(elapsedTime)}
      </div>

      <div className="clock-controls">
        <button 
          onClick={toggleRunning} 
          className={`clock-btn ${isRunning ? 'pause' : 'play'}`}
        >
          {isRunning ? '⏸️ Pause' : '▶️ Start'}
        </button>
        <button onClick={reset} className="clock-btn reset">
          🔄 Reset
        </button>
      </div>

      <div className="clock-info">
        Click start to begin tracking elapsed time
      </div>
    </div>
  );
};

export default Clock;
