/**
 * Format seconds into valid SRT timestamp: HH:MM:SS,mmm
 * Example: 00:01:23,450
 */
export function formatTimeSRT(seconds) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  // Convert to total milliseconds and round to avoid float precision artifacts
  const totalMs = Math.round(seconds * 1000);
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

/**
 * Format seconds into valid WebVTT timestamp: HH:MM:SS.mmm
 * Example: 00:01:23.450
 */
export function formatTimeVTT(seconds) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  // Convert to total milliseconds and round to avoid float precision artifacts
  const totalMs = Math.round(seconds * 1000);
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}

/**
 * Human readable clock display: MM:SS or HH:MM:SS
 */
export function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 1000);
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);

  const pad = (n) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Generate standard SubRip (.srt) formatted string from transcript segments
 * Follows canonical SubRip specification:
 * 1
 * 00:00:01,000 --> 00:00:04,500
 * Subtitle text
 *
 * 2
 * 00:00:05,000 --> 00:00:08,200
 * Next subtitle text
 */
export function generateSRT(segments) {
  if (!segments || segments.length === 0) return '';

  return (
    segments
      .map((seg, idx) => {
        const index = idx + 1;
        const start = formatTimeSRT(seg.startTime);
        // Ensure segment has at least 0.5s duration for subtitle display readability
        const endSec = Math.max(seg.endTime, seg.startTime + 0.5);
        const end = formatTimeSRT(endSec);
        const text = seg.text ? seg.text.trim() : '';

        return `${index}\n${start} --> ${end}\n${text}`;
      })
      .join('\n\n') + '\n'
  );
}

/**
 * Generate standard WebVTT (.vtt) formatted string from transcript segments
 * Follows W3C WebVTT specification:
 * WEBVTT
 *
 * 1
 * 00:00:01.000 --> 00:00:04.500
 * Subtitle text
 */
export function generateVTT(segments) {
  if (!segments || segments.length === 0) return 'WEBVTT\n\n';

  const cues = segments
    .map((seg, idx) => {
      const index = idx + 1;
      const start = formatTimeVTT(seg.startTime);
      const endSec = Math.max(seg.endTime, seg.startTime + 0.5);
      const end = formatTimeVTT(endSec);
      const text = seg.text ? seg.text.trim() : '';

      return `${index}\n${start} --> ${end}\n${text}`;
    })
    .join('\n\n');

  return `WEBVTT\n\n${cues}\n`;
}

/**
 * Generate clean plain text transcript with optional timestamps
 */
export function generatePlainText(segments, includeTimestamps = true) {
  if (!segments || segments.length === 0) return '';

  return segments
    .map((seg) => {
      const start = formatDuration(seg.startTime);
      const text = seg.text ? seg.text.trim() : '';
      if (includeTimestamps) {
        return `[${start}] ${text}`;
      }
      return text;
    })
    .join('\n');
}

/**
 * Build sanitized filename based on session name and file extension
 */
export function getExportFilename(sessionName, extension = 'srt') {
  const sanitized = (sessionName || 'captionpilot_session')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '');

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const base = sanitized || 'captionpilot_session';

  return `${base}_${dateStr}.${extension}`;
}

/**
 * Download a file in the browser using Blob URL
 */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
