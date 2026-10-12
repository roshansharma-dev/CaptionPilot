import React, { useRef, useEffect, useState, memo } from 'react';
import { SegmentItem } from './SegmentItem';
import { RadioIcon, MicIcon } from './Icons';

// Memoized component to avoid unnecessary re-renders of unrelated dashboard parts
export const TranscriptPanel = memo(function TranscriptPanel({
  isListening,
  interimTranscript,
  segments,
  onUpdateSegment,
  onDeleteSegment,
  onResearchSegment,
  selectedLanguage,
}) {
  const [autoScroll, setAutoScroll] = useState(true);
  const segmentsEndRef = useRef(null);

  // Auto‑scroll when new segments arrive or interim transcript changes
  useEffect(() => {
    if (autoScroll && segmentsEndRef.current) {
      segmentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, interimTranscript, autoScroll]);

  // Development‑only latency measurement for interim renders
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Latency] TranscriptPanel render (interim) at', performance.now());
    }
  }, [interimTranscript]);

  return (
    <div className="transcript-panel-wrapper">
      {/* Live Active Interim Box */}
      <div className={`live-interim-box ${isListening ? 'interim-active' : 'interim-idle'}`}>
        <div className="interim-header">
          <div className="interim-status">
            {isListening ? (
              <>
                <span className="live-wave-dot" />
                <span className="interim-title">Live Speech Stream</span>
                <span className="interim-sub">Listening in {selectedLanguage}</span>
              </>
            ) : (
              <>
                <MicIcon className="w-4 h-4 text-slate-500" />
                <span className="interim-title text-slate-400">Speech Recognition Standby</span>
              </>
            )}
          </div>
          {isListening && (
            <div className="audio-level-visualizer">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
              <span className="bar bar-4" />
              <span className="bar bar-5" />
            </div>
          )}
        </div>
        <div className="interim-content">
          {interimTranscript ? (
            <p className="interim-text">
              {interimTranscript}<span className="cursor-blink">|</span>
            </p>
          ) : isListening ? (
            <p className="interim-placeholder text-purple-300">
              🎙️ Speak into your microphone to generate real-time captions...
            </p>
          ) : (
            <p className="interim-placeholder text-slate-500">
              Microphone is idle. Press <strong className="text-slate-300">Start Captions</strong> above to begin transcribing live speech.
            </p>
          )}
        </div>
      </div>

      {/* Segments History Panel */}
      <div className="segments-history-panel">
        <div className="segments-panel-header">
          <div className="segments-header-left">
            <h3 className="panel-title">Finalized Transcript Segments</h3>
            <span className="segments-count-pill">{segments.length} saved</span>
          </div>

          <div className="segments-header-right">
            <label className="toggle-label" title="Automatically follow new captions">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-text">Auto-scroll</span>
            </label>
          </div>
        </div>

        <div className="segments-list-container">
          {segments.length === 0 ? (
            <div className="segments-empty-state">
              <div className="empty-icon-wrap">
                <RadioIcon className="w-8 h-8 text-purple-400 opacity-60" />
              </div>
              <h4 className="empty-title">No Segments Recorded Yet</h4>
              <p className="empty-description">
                As you speak, finalized phrases will automatically be converted into subtitle segments with precise start and end timestamps.
              </p>
              <div className="empty-tips">
                <span className="tip-item">⚡ Instant Web Speech transcribing</span>
                <span className="tip-item">⏱️ Millisecond timestamping</span>
                <span className="tip-item">🎬 Ready for SRT/VTT export</span>
              </div>
            </div>
          ) : (
            <div className="segments-scroll-area">
              {segments.map((seg) => (
                <SegmentItem
                  key={seg.id}
                  segment={seg}
                  onUpdate={onUpdateSegment}
                  onDelete={onDeleteSegment}
                  onResearch={onResearchSegment}
                />
              ))}
              <div ref={segmentsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
