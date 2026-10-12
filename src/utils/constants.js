export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', accent: 'General American' },
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳', accent: 'Indian English' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧', accent: 'British English' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)', flag: '🇮🇳', accent: 'Devanagari / Standard' },
];

export const BROADCAST_CHANNEL_NAME = 'captionpilot_obs_sync';
export const STORAGE_KEY_SEGMENTS = 'captionpilot_segments_cache';
export const STORAGE_KEY_CURRENT = 'captionpilot_current_stream';
export const STORAGE_KEY_SETTINGS = 'captionpilot_overlay_settings';
export const STORAGE_KEY_SESSION = 'captionpilot_active_session';

export const DEFAULT_OVERLAY_SETTINGS = {
  fontSize: 28,
  lineHeight: 1.4,
  fontFamily: 'system-ui, sans-serif',
  textColor: '#ffffff',
  backgroundColor: 'rgba(10, 15, 29, 0.85)',
  borderColor: 'rgba(139, 92, 246, 0.35)',
  position: 'bottom', // 'bottom', 'top', 'center'
  textAlign: 'center', // 'left', 'center', 'right'
  showInterim: true,
  showTimestamps: false,
  maxLines: 2,
  animation: 'fade',
};
