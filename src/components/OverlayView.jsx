import React, { useState } from 'react';
import { useBroadcastSync } from '../hooks/useBroadcastSync';

export function OverlayView() {
  const { activeText, isInterim, isListening } = useBroadcastSync();

  // Lazy initializer to read URL query parameters cleanly on mount
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const val = parseInt(params.get('size'), 10);
      if (!isNaN(val)) return val;
    }
    return 34;
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const val = params.get('theme');
      if (val) return val;
    }
    return 'pill';
  });

  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const val = params.get('position');
      if (val) return val;
    }
    return 'bottom';
  });

  const [showControls, setShowControls] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('controls') === 'false' || params.get('hidecontrols') === '1') {
        return false;
      }
    }
    return true;
  });

  const [testText, setTestText] = useState('');

  // Display text: either active stream text, or test text
  const displayText = activeText || testText;

  const handleTestCaption = () => {
    if (testText) {
      setTestText('');
    } else {
      setTestText('Welcome to the live stream! This is a test caption preview for OBS Studio.');
      setTimeout(() => {
        setTestText('');
      }, 6000);
    }
  };

  return (
    <div className={`obs-overlay-root position-${position}`}>
      {/* OBS Streamer Mini Controls Bar (can be hidden or toggled) */}
      {showControls && (
        <div className="obs-controls-bar">
          <div className="obs-controls-left">
            <span className="obs-tag">OBS Browser Source</span>
            <div className={`obs-status-dot ${isListening ? 'dot-active' : 'dot-idle'}`} />
            <span className="obs-status-text">
              {isListening ? 'Sync Active (Streaming)' : 'Standby (Waiting for Mic)'}
            </span>
          </div>

          <div className="obs-controls-right">
            {/* Font Size */}
            <div className="obs-ctrl-item">
              <label>Size:</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="obs-select"
              >
                <option value={24}>24px</option>
                <option value={32}>32px</option>
                <option value={38}>38px</option>
                <option value={48}>48px</option>
              </select>
            </div>

            {/* Theme */}
            <div className="obs-ctrl-item">
              <label>Style:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="obs-select"
              >
                <option value="pill">Dark Pill</option>
                <option value="outline">High Contrast Outline</option>
                <option value="cinema">Cinema Box</option>
              </select>
            </div>

            {/* Position */}
            <div className="obs-ctrl-item">
              <label>Pos:</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="obs-select"
              >
                <option value="bottom">Bottom</option>
                <option value="center">Center</option>
                <option value="top">Top</option>
              </select>
            </div>

            {/* Test Button */}
            <button
              onClick={handleTestCaption}
              className="btn-obs-test"
              title="Preview caption display without speaking"
            >
              {testText ? 'Clear Test' : 'Preview Test'}
            </button>

            {/* Hide Controls Button */}
            <button
              onClick={() => setShowControls(false)}
              className="btn-obs-hide"
              title="Hide this top bar for clean OBS capture"
            >
              Hide Bar
            </button>
          </div>
        </div>
      )}

      {/* Hidden button to re-show controls if hidden */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="btn-obs-unhide"
          title="Show overlay controls"
        >
          ⚙️
        </button>
      )}

      {/* Live Captions Rendering Area */}
      <div className="obs-captions-stage">
        {displayText ? (
          <div
            className={`obs-caption-container theme-${theme} ${isInterim ? 'is-interim' : 'is-final'}`}
            style={{ fontSize: `${fontSize}px` }}
          >
            <span className="obs-caption-text">
              {displayText}
              {isInterim && <span className="obs-typing-cursor">▌</span>}
            </span>
          </div>
        ) : (
          /* Subtle watermark when idle so streamer knows source is positioned */
          !isListening && (
            <div className="obs-idle-placeholder">
              <span className="obs-idle-hint">
                [OBS Caption Source Ready • Start Captions in Dashboard]
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
