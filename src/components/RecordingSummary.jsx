import React, { useState } from 'react';
import { ClockIcon, EditIcon, CheckIcon, TrashIcon, RadioIcon } from './Icons';
import { formatDuration } from '../utils/subtitles';

export function RecordingSummary({
  sessionName,
  onUpdateSessionName,
  isListening,
  elapsedTime,
  segmentsCount,
  totalWords,
  languageLabel,
  onStartNewSession,
  onClearTranscript,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(sessionName);

  const handleStartEditName = () => {
    setNameDraft(sessionName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length > 0) {
      onUpdateSessionName(trimmed);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingName(false);
    }
  };

  // Calculate words per minute (WPM)
  const durationMinutes = elapsedTime / 60;
  const wpm = durationMinutes > 0.1 && totalWords > 0 ? Math.round(totalWords / durationMinutes) : 0;

  return (
    <div className="recording-summary-card">
      <div className="summary-header">
        <div className="summary-title-col">
          <div className="session-name-row">
            {!isEditingName ? (
              <div className="session-name-display" onClick={handleStartEditName} title="Click to rename session">
                <h3 className="session-title">{sessionName}</h3>
                <button className="btn-edit-session-name" title="Rename session">
                  <EditIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="session-name-edit-form">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  className="session-name-input"
                  autoFocus
                  placeholder="Enter session name..."
                />
                <button onClick={handleSaveName} className="btn-save-session-name" title="Save name">
                  <CheckIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className={`session-status-badge ${isListening ? 'badge-recording' : 'badge-idle'}`}>
              <span className="summary-dot"></span>
              {isListening ? 'Recording' : 'Session Active'}
            </span>
          </div>
          <p className="summary-subtitle">
            Language: <span className="text-purple-300 font-medium">{languageLabel}</span> • Transcript data is preserved automatically
          </p>
        </div>

        <div className="summary-actions-col">
          <button
            onClick={() => {
              if (segmentsCount === 0 || window.confirm('Start a new session? This will archive the current transcript.')) {
                onStartNewSession();
              }
            }}
            className="btn-new-session"
            title="Start a new recording session"
          >
            + New Session
          </button>
          {segmentsCount > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all transcript segments?')) {
                  onClearTranscript();
                }
              }}
              className="btn-danger-ghost-sm"
              title="Clear transcript data"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="summary-metrics-grid">
        <div className="summary-metric-box">
          <div className="metric-header">
            <ClockIcon className="w-4 h-4 text-purple-400" />
            <span className="metric-label">Total Duration</span>
          </div>
          <div className="metric-val-row">
            <span className="metric-val font-mono">{formatDuration(elapsedTime)}</span>
          </div>
          <span className="metric-footnote">Session elapsed</span>
        </div>

        <div className="summary-metric-box">
          <div className="metric-header">
            <RadioIcon className="w-4 h-4 text-blue-400" />
            <span className="metric-label">Segments</span>
          </div>
          <div className="metric-val-row">
            <span className="metric-val font-mono">{segmentsCount}</span>
          </div>
          <span className="metric-footnote">Subtitles saved</span>
        </div>

        <div className="summary-metric-box">
          <div className="metric-header">
            <span className="metric-icon-text">💬</span>
            <span className="metric-label">Word Count</span>
          </div>
          <div className="metric-val-row">
            <span className="metric-val font-mono">{totalWords}</span>
          </div>
          <span className="metric-footnote">Words captured</span>
        </div>

        <div className="summary-metric-box">
          <div className="metric-header">
            <span className="metric-icon-text">⚡</span>
            <span className="metric-label">Speech Pace</span>
          </div>
          <div className="metric-val-row">
            <span className="metric-val font-mono">{wpm > 0 ? `${wpm}` : '—'}</span>
            {wpm > 0 && <span className="metric-unit">WPM</span>}
          </div>
          <span className="metric-footnote">Average speed</span>
        </div>
      </div>
    </div>
  );
}
