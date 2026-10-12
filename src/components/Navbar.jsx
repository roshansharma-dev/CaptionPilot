import React, { useState } from 'react';
import { TvIcon, ExternalLinkIcon, CheckIcon, CopyIcon } from './Icons';

export function Navbar({ isListening }) {
  const [copied, setCopied] = useState(false);

  const getOverlayUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/overlay`;
    }
    return '/overlay';
  };

  const handleCopyOverlayUrl = async () => {
    const url = getOverlayUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleOpenOverlay = () => {
    window.open(getOverlayUrl(), '_blank', 'width=1280,height=300,toolbar=0,menubar=0,location=0');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon-wrapper">
            <span className="brand-symbol">⚡</span>
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">CaptionPilot</h1>
              <span className="badge-mvp">Creator Edition</span>
            </div>
            <p className="brand-subtitle">Real-time captions & subtitles for streamers and YouTubers</p>
          </div>
        </div>

        <div className="navbar-actions">
          <div className={`status-pill ${isListening ? 'status-active' : 'status-idle'}`}>
            <span className="status-dot"></span>
            <span className="status-label">
              {isListening ? 'CAPTIONS LIVE' : 'MIC STANDBY'}
            </span>
          </div>

          <div className="obs-btn-group">
            <button
              onClick={handleCopyOverlayUrl}
              className="btn-secondary btn-icon-sm"
              title="Copy OBS Browser Source URL"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-emerald-400" />
                  <span>URL Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4" />
                  <span>Copy OBS Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenOverlay}
              className="btn-obs-preview"
              title="Launch overlay preview window"
            >
              <TvIcon className="w-4 h-4" />
              <span>Launch Overlay</span>
              <ExternalLinkIcon className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
