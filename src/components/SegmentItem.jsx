import React, { useState, useEffect, useRef } from 'react';
import { CopyIcon, CheckIcon, TrashIcon, ClockIcon, EditIcon, CloseIcon, SearchIcon } from './Icons';

export function SegmentItem({ segment, onUpdate, onDelete, onResearch }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(segment.text);
  const textareaRef = useRef(null);

  // Auto-focus and adjust height when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(segment.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleStartEdit = () => {
    setDraftText(segment.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftText(segment.text);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const trimmed = draftText.trim();
    if (trimmed.length > 0 && onUpdate) {
      onUpdate(segment.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const durationSec = Math.max(0, segment.endTime - segment.startTime).toFixed(1);

  return (
    <div className={`segment-card ${isEditing ? 'segment-card-editing' : ''}`}>
      <div className="segment-meta-header">
        <div className="segment-indices">
          <span className="segment-index-badge">#{segment.index}</span>
          <span className="segment-time-range">
            <ClockIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>{segment.formattedStart}</span>
            <span className="time-arrow">→</span>
            <span>{segment.formattedEnd}</span>
          </span>
          <span className="segment-duration-tag">{durationSec}s</span>
          {segment.language && (
            <span className="segment-lang-tag">{segment.language}</span>
          )}
          {segment.isEdited && (
            <span className="segment-edited-tag" title="Segment text was modified">
              edited
            </span>
          )}
        </div>

        <div className="segment-actions">
          {!isEditing ? (
            <>
              {onUpdate && (
                <button
                  onClick={handleStartEdit}
                  className="btn-tiny-action btn-tiny-edit"
                  title="Edit segment text"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {onResearch && (
                <button
                  onClick={() => onResearch(segment)}
                  className="btn-tiny-action btn-tiny-research"
                  title="Research technical terms in this segment via SerpApi"
                >
                  <SearchIcon className="w-3.5 h-3.5 text-blue-400" />
                </button>
              )}
              <button
                onClick={handleCopy}
                className="btn-tiny-action"
                title="Copy this segment"
              >
                {copied ? (
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(segment.id)}
                  className="btn-tiny-action btn-tiny-danger"
                  title="Delete segment"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <div className="segment-edit-buttons">
              <button
                onClick={handleSaveEdit}
                className="btn-segment-save"
                title="Save edited text (Enter)"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-segment-cancel"
                title="Cancel changes (Esc)"
              >
                <CloseIcon className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="segment-text-body">
        {isEditing ? (
          <div className="segment-edit-box">
            <textarea
              ref={textareaRef}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="segment-edit-textarea"
              rows={2}
              placeholder="Edit segment text..."
            />
            <div className="segment-edit-tip">
              <span>Press <kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel</span>
            </div>
          </div>
        ) : (
          <span className="segment-rendered-text">{segment.text}</span>
        )}
      </div>
    </div>
  );
}
