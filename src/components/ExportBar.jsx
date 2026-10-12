import React, { useState } from 'react';
import { DownloadIcon, CopyIcon, CheckIcon } from './Icons';
import {
  generateSRT,
  generateVTT,
  generatePlainText,
  downloadFile,
  getExportFilename,
} from '../utils/subtitles';

export function ExportBar({ segments, sessionName }) {
  const [copied, setCopied] = useState(false);
  const [previewFormat, setPreviewFormat] = useState(null); // null, 'srt', 'vtt'
  const hasSegments = segments && segments.length > 0;

  const handleDownloadSRT = () => {
    if (!hasSegments) return;
    const content = generateSRT(segments);
    const filename = getExportFilename(sessionName, 'srt');
    downloadFile(content, filename, 'application/x-subrip;charset=utf-8');
  };

  const handleDownloadVTT = () => {
    if (!hasSegments) return;
    const content = generateVTT(segments);
    const filename = getExportFilename(sessionName, 'vtt');
    downloadFile(content, filename, 'text/vtt;charset=utf-8');
  };

  const handleDownloadTXT = () => {
    if (!hasSegments) return;
    const content = generatePlainText(segments, true);
    const filename = getExportFilename(sessionName, 'txt');
    downloadFile(content, filename, 'text/plain;charset=utf-8');
  };

  const handleCopyAll = async () => {
    if (!hasSegments) return;
    const content = generatePlainText(segments, false);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const getPreviewContent = () => {
    if (!hasSegments) return '';
    if (previewFormat === 'srt') return generateSRT(segments);
    if (previewFormat === 'vtt') return generateVTT(segments);
    return '';
  };

  return (
    <div className="export-card">
      <div className="export-header">
        <div className="export-title-group">
          <DownloadIcon className="w-5 h-5 text-purple-400" />
          <h3 className="export-title">Export & Subtitle Downloads</h3>
        </div>
        <p className="export-subtitle">
          Export recorded segments for YouTube Studio, Premiere Pro, DaVinci Resolve, or stream archives.
          {sessionName && (
            <span className="export-session-tag">
              File prefix: <strong>{sessionName}</strong>
            </span>
          )}
        </p>
      </div>

      <div className="export-buttons-grid">
        {/* SRT Button */}
        <button
          onClick={handleDownloadSRT}
          disabled={!hasSegments}
          className={`btn-export ${hasSegments ? 'btn-export-primary' : 'btn-export-disabled'}`}
          title={hasSegments ? 'Download valid SubRip (.srt) subtitle file' : 'Record segments to export SRT'}
        >
          <div className="export-btn-icon">
            <DownloadIcon className="w-4 h-4" />
          </div>
          <div className="export-btn-text">
            <span className="export-btn-label">Download SRT</span>
            <span className="export-btn-desc">SubRip (.srt) • HH:MM:SS,mmm</span>
          </div>
        </button>

        {/* VTT Button */}
        <button
          onClick={handleDownloadVTT}
          disabled={!hasSegments}
          className={`btn-export ${hasSegments ? 'btn-export-secondary' : 'btn-export-disabled'}`}
          title={hasSegments ? 'Download valid WebVTT (.vtt) file with header' : 'Record segments to export VTT'}
        >
          <div className="export-btn-icon">
            <DownloadIcon className="w-4 h-4" />
          </div>
          <div className="export-btn-text">
            <span className="export-btn-label">Download VTT</span>
            <span className="export-btn-desc">WebVTT (.vtt) • HH:MM:SS.mmm</span>
          </div>
        </button>

        {/* Plain Text Button */}
        <button
          onClick={handleDownloadTXT}
          disabled={!hasSegments}
          className={`btn-export ${hasSegments ? 'btn-export-ghost' : 'btn-export-disabled'}`}
          title={hasSegments ? 'Download raw timestamped text log' : 'Record segments to export text'}
        >
          <div className="export-btn-icon">
            <DownloadIcon className="w-4 h-4" />
          </div>
          <div className="export-btn-text">
            <span className="export-btn-label">Download TXT</span>
            <span className="export-btn-desc">Plain text with times</span>
          </div>
        </button>

        {/* Copy All Button */}
        <button
          onClick={handleCopyAll}
          disabled={!hasSegments}
          className={`btn-export ${hasSegments ? 'btn-export-ghost' : 'btn-export-disabled'}`}
          title={hasSegments ? 'Copy full transcript text to clipboard' : 'Record segments to copy'}
        >
          <div className="export-btn-icon">
            {copied ? (
              <CheckIcon className="w-4 h-4 text-emerald-400" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
          </div>
          <div className="export-btn-text">
            <span className="export-btn-label">{copied ? 'Copied to Clipboard!' : 'Copy Transcript'}</span>
            <span className="export-btn-desc">Raw text content</span>
          </div>
        </button>
      </div>

      {/* Subtitle Preview Toggle Bar */}
      {hasSegments && (
        <div className="export-preview-controls">
          <span className="preview-label">Inspect Subtitles:</span>
          <div className="preview-tabs">
            <button
              onClick={() => setPreviewFormat(previewFormat === 'srt' ? null : 'srt')}
              className={`btn-preview-tab ${previewFormat === 'srt' ? 'active-tab' : ''}`}
            >
              {previewFormat === 'srt' ? 'Hide SRT Preview' : 'Preview SRT Code'}
            </button>
            <button
              onClick={() => setPreviewFormat(previewFormat === 'vtt' ? null : 'vtt')}
              className={`btn-preview-tab ${previewFormat === 'vtt' ? 'active-tab' : ''}`}
            >
              {previewFormat === 'vtt' ? 'Hide VTT Preview' : 'Preview VTT Code'}
            </button>
          </div>
        </div>
      )}

      {/* Code Preview Viewer */}
      {hasSegments && previewFormat && (
        <div className="export-code-preview">
          <div className="code-preview-header">
            <span className="code-preview-title">
              {previewFormat.toUpperCase()} File Preview ({segments.length} cues)
            </span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(getPreviewContent());
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="btn-copy-code"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </button>
          </div>
          <pre className="code-preview-block">
            <code>{getPreviewContent()}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
