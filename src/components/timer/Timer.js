import React, { useState, useEffect, useRef } from 'react';
import './Timer.css';
import { saveComponentState, getComponentState } from '../../utils/screenStorage';

const Timer = ({ onDragStart, onDragEnd, componentKey }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef(null);

  // Load state on mount
  useEffect(() => {
    if (componentKey) {
      const savedState = getComponentState(componentKey);
      if (savedState) {
        if (savedState.timeRemaining !== undefined) setTimeRemaining(savedState.timeRemaining);
        if (savedState.isRunning !== undefined) setIsRunning(savedState.isRunning);
      }
      setIsInitialized(true);
    }
  }, [componentKey]);

  // Save state when it changes (but only after initialization)
  useEffect(() => {
    if (componentKey && isInitialized) {
      saveComponentState(componentKey, {
        timeRemaining,
        isRunning: false // Don't restore as running
      });
    }
  }, [componentKey, timeRemaining, isInitialized]);

  const handleHeaderDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(e);
  };

  const handleHeaderDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) onDragEnd(e);
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            // Stop flashing after 5 seconds
            setTimeout(() => setIsComplete(false), 5000);
            return 0;
          }
          return prev - 1;
        });
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
  }, [isRunning, timeRemaining]);

  const addTime = (seconds) => {
    setTimeRemaining(prev => prev + seconds);
    setIsComplete(false);
    if (!isRunning && seconds > 0) {
      setIsRunning(true);
    }
  };

  const startTimer = () => {
    if (timeRemaining > 0) {
      setIsRunning(true);
      setIsComplete(false);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    setIsComplete(false);
  };

  const setCustomTime = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const totalSeconds = mins * 60 + secs;
    
    if (totalSeconds > 0) {
      setTimeRemaining(totalSeconds);
      setIsRunning(true);
      setIsComplete(false);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`timer ${isComplete ? 'timer-complete' : ''}`}>
      <div 
        className="component-drag-handle"
        draggable
        onDragStart={handleHeaderDragStart}
        onDragEnd={handleHeaderDragEnd}
        title="Drag to move"
      >
        ⋮⋮
      </div>
      
      <h3>⏱️ Timer</h3>

      <div className="timer-display">
        {formatTime(timeRemaining)}
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button 
            className="timer-button start"
            onClick={startTimer}
            disabled={timeRemaining === 0}
          >
            Start
          </button>
        ) : (
          <button 
            className="timer-button pause"
            onClick={pauseTimer}
          >
            Pause
          </button>
        )}
        <button 
          className="timer-button reset"
          onClick={resetTimer}
        >
          Reset
        </button>
      </div>

      <div className="quick-timers">
        <h4>Quick Add</h4>
        <div className="quick-timer-buttons">
          <button 
            className="quick-timer-button"
            onClick={() => addTime(30)}
          >
            +30s
          </button>
          <button 
            className="quick-timer-button"
            onClick={() => addTime(60)}
          >
            +1m
          </button>
          <button 
            className="quick-timer-button"
            onClick={() => addTime(300)}
          >
            +5m
          </button>
          <button 
            className="quick-timer-button"
            onClick={() => addTime(600)}
          >
            +10m
          </button>
        </div>
      </div>

      <div className="custom-time">
        <h4>Custom Time</h4>
        <div className="custom-time-inputs">
          <input
            type="number"
            min="0"
            max="99"
            placeholder="MM"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="time-input"
          />
          <span className="time-separator">:</span>
          <input
            type="number"
            min="0"
            max="59"
            placeholder="SS"
            value={customSeconds}
            onChange={(e) => setCustomSeconds(e.target.value)}
            className="time-input"
          />
          <button 
            className="set-time-button"
            onClick={setCustomTime}
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
