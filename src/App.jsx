import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ControlBar } from './components/ControlBar';
import { RecordingSummary } from './components/RecordingSummary';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ExportBar } from './components/ExportBar';
import { TechnicalResearchPanel } from './components/TechnicalResearchPanel';
import { OverlayView } from './components/OverlayView';
import { ErrorBanner } from './components/ErrorBanner';
import { TvIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from './components/Icons';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { SUPPORTED_LANGUAGES } from './utils/constants';
import './App.css';

export default function App() {
  // Simple client-side routing between Dashboard and /overlay
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/overlay' || hash === '#/overlay' || hash === '#overlay') {
        return 'overlay';
      }
    }
    return 'dashboard';
  });

  const [overlayCopied, setOverlayCopied] = useState(false);
  const [targetResearchSegment, setTargetResearchSegment] = useState(null);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/overlay' || hash === '#/overlay' || hash === '#overlay') {
        setCurrentRoute('overlay');
      } else {
        setCurrentRoute('dashboard');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Web Speech API Hook with session preservation & editing
  const {
    isSupported,
    isListening,
    isStarting,
    language,
    sessionName,
    setSessionName,
    interimTranscript,
    segments,
    error,
    elapsedTime,
    startListening,
    stopListening,
    changeLanguage,
    updateSegment,
    clearTranscript,
    startNewSession,
    deleteSegment,
    clearError,
  } = useSpeechRecognition({ initialLanguage: 'en-US' });

  // Calculate total word count across all finalized segments
  const totalWords = useMemo(() => {
    return segments.reduce((sum, seg) => {
      const words = seg.text ? seg.text.trim().split(/\s+/).filter(Boolean).length : 0;
      return sum + words;
    }, 0);
  }, [segments]);

  // Current language display label
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const getOverlayUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/overlay`;
    }
    return '/overlay';
  };

  const handleCopyOverlayUrl = async () => {
    try {
      await navigator.clipboard.writeText(getOverlayUrl());
      setOverlayCopied(true);
      setTimeout(() => setOverlayCopied(false), 2200);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleApplyCorrection = (segmentId, suggestedCorrection) => {
    const seg = segments.find((s) => s.id === segmentId);
    if (!seg) return;

    // Explicit user review confirmation before updating segment
    const confirmed = window.confirm(
      `Review & manually correct Segment #${seg.index}?\n\nOriginal Speech: "${seg.text}"\nVerified Spelling: "${suggestedCorrection}"\n\nClick OK to apply this verified technical correction.`
    );

    if (confirmed) {
      updateSegment(segmentId, suggestedCorrection);
      setTargetResearchSegment(null);
    }
  };

  // If viewing the OBS Overlay page
  if (currentRoute === 'overlay') {
    return <OverlayView />;
  }

  // Otherwise render the full Dashboard
  return (
    <div className="captionpilot-app">
      <Navbar isListening={isListening} />

      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Error & Incompatibility Banner */}
          <ErrorBanner
            error={error}
            onDismiss={clearError}
            onRetry={startListening}
          />

          {/* Top Control Bar */}
          <ControlBar
            isListening={isListening}
            isStarting={isStarting}
            isSupported={isSupported}
            language={language}
            elapsedTime={elapsedTime}
            segmentsCount={segments.length}
            totalWords={totalWords}
            onStart={startListening}
            onStop={stopListening}
            onLanguageChange={changeLanguage}
            onClear={clearTranscript}
          />

          {/* Recording Session Overview & Metrics */}
          <RecordingSummary
            sessionName={sessionName}
            onUpdateSessionName={setSessionName}
            isListening={isListening}
            elapsedTime={elapsedTime}
            segmentsCount={segments.length}
            totalWords={totalWords}
            languageLabel={currentLangObj.label}
            onStartNewSession={startNewSession}
            onClearTranscript={clearTranscript}
          />

          {/* Main Content Layout Grid */}
          <div className="dashboard-grid">
            {/* Left & Center: Live Transcript Stream & Export */}
            <div className="dashboard-primary-col">
              <TranscriptPanel
                isListening={isListening}
                interimTranscript={interimTranscript}
                segments={segments}
                onUpdateSegment={updateSegment}
                onDeleteSegment={deleteSegment}
                onResearchSegment={(seg) => setTargetResearchSegment(seg)}
                selectedLanguage={currentLangObj.label}
              />

              <ExportBar
                segments={segments}
                sessionName={sessionName}
              />
            </div>

            {/* Right: OBS Integration Card & Technical Research Panel */}
            <div className="dashboard-sidebar-col">
              {/* OBS Integration Helper Card */}
              <div className="sidebar-card obs-helper-card">
                <div className="sidebar-card-header">
                  <div className="sidebar-icon-box">
                    <TvIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="sidebar-card-title">OBS Browser Source</h3>
                    <p className="sidebar-card-desc">Embed captions directly in your stream</p>
                  </div>
                </div>

                <div className="obs-link-box">
                  <span className="obs-link-label">Overlay URL:</span>
                  <div className="obs-link-input-group">
                    <input
                      type="text"
                      readOnly
                      value={getOverlayUrl()}
                      className="obs-link-field"
                    />
                    <button
                      onClick={handleCopyOverlayUrl}
                      className="btn-icon-copy"
                      title="Copy URL"
                    >
                      {overlayCopied ? (
                        <CheckIcon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <CopyIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="obs-setup-instructions">
                  <ol className="obs-steps-list">
                    <li>Add a new <strong>Browser</strong> source in OBS Studio.</li>
                    <li>Paste the Overlay URL above.</li>
                    <li>Set Width: <strong>1280</strong>, Height: <strong>300</strong>.</li>
                    <li>Captions sync automatically with zero lag!</li>
                  </ol>
                </div>

                <div className="obs-card-actions">
                  <a
                    href="/overlay"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-preview-overlay-full"
                  >
                    <span>Open Overlay Tab</span>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* SerpApi Google Search Research Panel */}
              <TechnicalResearchPanel
                targetSegment={targetResearchSegment}
                onClearTargetSegment={() => setTargetResearchSegment(null)}
                onApplyCorrectionToSegment={handleApplyCorrection}
                segments={segments}
              />

              {/* Creator Tips Card */}
              <div className="sidebar-card tips-card">
                <h4 className="tips-title">💡 Streamer Pro-Tips</h4>
                <ul className="tips-list">
                  <li>
                    <strong>SerpApi Research:</strong> Click the 🔍 icon next to any transcript segment to research technical jargon or library names on Google.
                  </li>
                  <li>
                    <strong>Dual Language:</strong> Switch seamlessly between English and Hindi during your livestream without losing previous segments.
                  </li>
                  <li>
                    <strong>Inline Editing:</strong> Click the ✏️ pencil icon on any finalized segment to manually correct recognized speech before exporting.
                  </li>
                  <li>
                    <strong>Instant Subtitles:</strong> Download <code>.SRT</code> or <code>.VTT</code> right after your stream and upload directly into YouTube Studio.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-container">
          <p className="footer-text">
            CaptionPilot • Real-time Speech Recognition & SerpApi Technical Term Research • OBS Studio Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
