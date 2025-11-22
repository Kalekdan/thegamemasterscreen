import React, { useState, useEffect, useRef } from 'react';
import './DiceResultOverlay.css';

const DiceResultOverlay = ({ diceResult }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [displayResult, setDisplayResult] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);
  const exitTimeoutRef = useRef(null);
  const prevDiceResultRef = useRef(null);

  useEffect(() => {
    // Check if this is a new dice result (not just a re-render)
    const isNewResult = diceResult !== prevDiceResultRef.current;
    prevDiceResultRef.current = diceResult;

    // Clear any pending exit animation when new result comes in
    if (isNewResult && exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
      setIsExiting(false);
    }

    if (diceResult && isNewResult) {
      // New result came in - trigger re-animation
      setDisplayResult(diceResult);
      setAnimationKey(prev => prev + 1); // Force animation to replay
    } else if (!diceResult && displayResult && !isExiting) {
      // Result was cleared, start exit animation
      setIsExiting(true);
      exitTimeoutRef.current = setTimeout(() => {
        setDisplayResult(null);
        setIsExiting(false);
        exitTimeoutRef.current = null;
      }, 300); // Match animation duration
    }

    return () => {
      // Only clear timeout on unmount, not on every render
      if (!diceResult && exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [diceResult, displayResult, isExiting]);

  if (!displayResult) return null;

  return (
    <div 
      key={animationKey}
      className={`dice-result-overlay ${isExiting ? 'exiting' : ''}`}
    >
      <div className="dice-result-content">
        <div className="dice-result-formula">{displayResult.formula}</div>
        <div className="dice-result-rolls">
          {displayResult.rolls.map((roll, idx) => (
            <span key={idx} className="dice-roll-value">{roll}</span>
          ))}
          {displayResult.modifier !== 0 && (
            <span className="dice-modifier">
              {displayResult.modifier > 0 ? '+' : ''}{displayResult.modifier}
            </span>
          )}
        </div>
        <div className="dice-result-total">= {displayResult.total}</div>
      </div>
    </div>
  );
};

export default DiceResultOverlay;
