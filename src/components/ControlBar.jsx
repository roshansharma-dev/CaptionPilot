import React from 'react';
import { PlayIcon, StopIcon, GlobeIcon, ClockIcon, TrashIcon } from './Icons';
import { SUPPORTED_LANGUAGES } from '../utils/constants';
import { formatDuration } from '../utils/subtitles';

export function ControlBar({
  isListening,
  isStarting,
  isSupported,
  language,
  elapsedTime,
  segmentsCount,
  totalWords,
  onStart,
  onStop,
  onLanguageChange,
  onClear,
}) {
  return (
    <div className="control-bar-card">
      <div className="control-bar-left">
        {/* Main Action Buttons */}
        {!isListening ? (
          <button
            className={`btn-start-captions ${!isSupported ? 'btn-disabled' : ''}`}
            onClick={onStart}
            disabled={!isSupported || isStarting}
            title={!isSupported ? 'Web Speech API is not supported in this browser' : 'Start live speech recognition'}
          >
            {isStarting ? (
              <>
                <span className="spinner-sm"></span>
                <span>Connecting Mic...</span>
              </>
            ) : (
              <>
                <div className="btn-icon-circle">
                  <PlayIcon className="w-4 h-4 ml-0.5" />
                </div>
                <span>Start Captions</span>
              </>
            )}
          </button>
        ) : (
          <button
            className="btn-stop-captions"
            onClick={onStop}
            title="Stop live speech recognition"
          >
            <div className="btn-icon-circle bg-red-500">
              <StopIcon className="w-4 h-4" />
            </div>
            <span>Stop Captions</span>
          </button>
        )}

        {/* Language Selection */}
        <div className="language-selector-wrapper">
          <label htmlFor="language-select" className="input-label">
            <GlobeIcon className="w-4 h-4 text-purple-400" />
            <span>Spoken Language</span>
          </label>
          <div className="select-container">
            <select
              id="language-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="select-field"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="control-bar-right">
        {/* Timer */}
        <div className="stat-pill" title="Current session elapsed time">
          <ClockIcon className="w-4 h-4 text-purple-400" />
          <div className="stat-info">
            <span className="stat-caption">Duration</span>
            <span className="stat-val font-mono">{formatDuration(elapsedTime)}</span>
          </div>
        </div>

        {/* Segments count */}
        <div className="stat-pill" title="Total captured subtitle segments">
          <div className="stat-info">
            <span className="stat-caption">Segments</span>
            <span className="stat-val font-mono">{segmentsCount}</span>
          </div>
        </div>

        {/* Word count */}
        <div className="stat-pill" title="Total recognized words">
          <div className="stat-info">
            <span className="stat-caption">Words</span>
            <span className="stat-val font-mono">{totalWords}</span>
          </div>
        </div>

        {/* Clear Button */}
        {segmentsCount > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all transcript segments?')) {
                onClear();
              }
            }}
            className="btn-danger-ghost"
            title="Clear current transcript history"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}
