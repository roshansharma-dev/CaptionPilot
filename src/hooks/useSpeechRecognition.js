import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDuration } from '../utils/subtitles';
import {
  BROADCAST_CHANNEL_NAME,
  STORAGE_KEY_CURRENT,
  STORAGE_KEY_SESSION,
} from '../utils/constants';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function loadInitialSession() {
  if (typeof window === 'undefined') {
    return { name: 'Live Stream Session', segments: [], elapsedTime: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || 'Live Stream Session',
        segments: Array.isArray(parsed.segments) ? parsed.segments : [],
        elapsedTime: typeof parsed.elapsedTime === 'number' ? parsed.elapsedTime : 0,
      };
    }
  } catch (_e) {
    // ignore
  }
  return { name: 'Live Stream Session', segments: [], elapsedTime: 0 };
}

export function useSpeechRecognition({ initialLanguage = 'en-US' } = {}) {
  const initialData = loadInitialSession();

  const [isSupported, setIsSupported] = useState(!!SpeechRecognitionAPI);
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [language, setLanguage] = useState(initialLanguage);
  const [sessionName, setSessionName] = useState(initialData.name);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [segments, setSegments] = useState(initialData.segments);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(initialData.elapsedTime);

  // References to keep state consistent across recognition callbacks
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const accumulatedTimeRef = useRef(initialData.elapsedTime);
  const sessionResumeTimeRef = useRef(null);
  const segmentStartTimeRef = useRef(initialData.elapsedTime);
  const timerIntervalRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const manualStopRef = useRef(false);

  // Auto-save session data to localStorage to preserve transcript data while recording session is active
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify({
          name: sessionName,
          segments,
          elapsedTime,
          updatedAt: Date.now(),
        })
      );
    } catch (_e) {
      // ignore
    }
  }, [sessionName, segments, elapsedTime]);

  // Setup broadcast channel for OBS Overlay synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      } catch (err) {
        console.warn('BroadcastChannel not available:', err);
      }
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Broadcast updates to OBS overlay
  const broadcastState = useCallback(
  (overrides = {}) => {
    const payload = {
      isListening: isListeningRef.current,
      language,
      interimText:
        overrides.interimText !== undefined ? overrides.interimText : interimTranscript,
      latestSegment: overrides.latestSegment || null,
      timestamp: Date.now(),
      ...overrides,
    };

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(payload);
      } catch (e) {
        console.error('Failed to broadcast message:', e);
      }
    }

    // For development, avoid noisy localStorage writes on every interim update.
    const hasNonInterim = Object.keys(overrides).some((k) => k !== 'interimText');
    if (hasNonInterim) {
      try {
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(payload));
      } catch (_e) {
        // ignore quota / privacy errors
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[Latency] interim broadcast (no localStorage) at', performance.now());
    }
  },
  [language, interimTranscript]
);

  // Helper to get current continuous elapsed time in seconds
  const getCurrentContinuousTime = useCallback(() => {
    if (!sessionResumeTimeRef.current) {
      return accumulatedTimeRef.current;
    }
    const currentChunkSec = (Date.now() - sessionResumeTimeRef.current) / 1000;
    return Math.max(0, accumulatedTimeRef.current + currentChunkSec);
  }, []);

  // Session timer ticker
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    sessionResumeTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      if (sessionResumeTimeRef.current) {
        const secs = Math.floor(getCurrentContinuousTime());
        setElapsedTime(secs);
      }
    }, 1000);
  }, [getCurrentContinuousTime]);

  const stopTimer = useCallback(() => {
    if (sessionResumeTimeRef.current) {
      const chunkSec = (Date.now() - sessionResumeTimeRef.current) / 1000;
      accumulatedTimeRef.current += chunkSec;
      sessionResumeTimeRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setElapsedTime(Math.floor(accumulatedTimeRef.current));
  }, []);

  // Initialize SpeechRecognition instance
  const initRecognition = useCallback(
    (targetLang) => {
      if (!SpeechRecognitionAPI) {
        setIsSupported(false);
        setError({
          type: 'UNSUPPORTED_BROWSER',
          title: 'Browser Not Supported',
          message:
            'Your browser does not support the Web Speech API. For real-time captions, please use Google Chrome, Microsoft Edge, Brave, or another Chromium-based browser.',
        });
        return null;
      }

      // Cleanup previous instance if any
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (_e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = targetLang || language;

      recognition.onstart = () => {
        setIsStarting(false);
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
        segmentStartTimeRef.current = getCurrentContinuousTime();
        startTimer();
        broadcastState({ isListening: true });
      };

      recognition.onresult = (event) => {
        let interim = '';
        const currentElapsedSec = getCurrentContinuousTime();

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptText = result[0]?.transcript || '';

          if (result.isFinal) {
            const trimmed = transcriptText.trim();
            if (trimmed.length > 0) {
              const startSec = segmentStartTimeRef.current;
              const endSec = currentElapsedSec;

              const newSegment = {
                id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                index: 0, // will be assigned
                text: trimmed,
                startTime: Math.round(startSec * 100) / 100,
                endTime: Math.round(Math.max(endSec, startSec + 0.8) * 100) / 100,
                formattedStart: formatDuration(startSec),
                formattedEnd: formatDuration(Math.max(endSec, startSec + 0.8)),
                language: recognition.lang,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
                isEdited: false,
              };

              setSegments((prev) => {
                const updated = [...prev, { ...newSegment, index: prev.length + 1 }];
                return updated;
              });

              // Reset segment start time for subsequent speech
              segmentStartTimeRef.current = currentElapsedSec;
              broadcastState({
                interimText: '',
                latestSegment: newSegment,
              });
            }
          } else {
            interim += transcriptText;
          }
        }

        setInterimTranscript(interim);
        if (interim) {
          broadcastState({ interimText: interim });
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        const errCode = event.error;

        if (errCode === 'no-speech') {
          // Normal pause in speech, do not treat as fatal error
          return;
        }

        if (errCode === 'not-allowed') {
          manualStopRef.current = true;
          isListeningRef.current = false;
          setIsListening(false);
          setIsStarting(false);
          stopTimer();
          setError({
            type: 'PERMISSION_DENIED',
            title: 'Microphone Access Denied',
            message:
              'Microphone access was blocked. Please click the camera/mic icon in your browser address bar and choose "Always allow" to enable captions.',
          });
          broadcastState({ isListening: false });
          return;
        }

        if (errCode === 'audio-capture') {
          manualStopRef.current = true;
          isListeningRef.current = false;
          setIsListening(false);
          setIsStarting(false);
          stopTimer();
          setError({
            type: 'NO_MIC',
            title: 'No Microphone Detected',
            message:
              'Unable to find an audio input device. Please plug in or select a working microphone and reload.',
          });
          broadcastState({ isListening: false });
          return;
        }

        if (errCode === 'network') {
          // Network errors are unrecoverable for the current session; stop listening and prevent auto‑restart.
          setError({
            type: 'NETWORK_ERROR',
            title: 'Speech Service Connection Error',
            message:
              'Network error communicating with the speech recognition service. Please check your internet connection.',
          });
          // Prevent onend from restarting
          manualStopRef.current = true;
          isListeningRef.current = false;
          setIsListening(false);
          setIsStarting(false);
          stopTimer();
          broadcastState({ isListening: false });
          return;
        }

        if (errCode === 'service-not-allowed') {
          manualStopRef.current = true;
          isListeningRef.current = false;
          setIsListening(false);
          setIsStarting(false);
          stopTimer();
          setError({
            type: 'SERVICE_DENIED',
            title: 'Speech Service Not Allowed',
            message:
              'Speech recognition is disabled or disallowed by your system/browser security policies.',
          });
          broadcastState({ isListening: false });
        }
      };

      recognition.onend = () => {
        // If user hasn't explicitly stopped, restart recognition (Chromium auto-stops on pauses)
        if (isListeningRef.current && !manualStopRef.current) {
          try {
            recognition.start();
          } catch (_e) {
            setTimeout(() => {
              if (isListeningRef.current && !manualStopRef.current) {
                try {
                  recognition.start();
                } catch (err) {
                  console.warn('Failed to auto-restart speech recognition:', err);
                }
              }
            }, 300);
          }
        } else {
          setIsListening(false);
          setIsStarting(false);
          isListeningRef.current = false;
          setInterimTranscript('');
          stopTimer();
          broadcastState({ isListening: false, interimText: '' });
        }
      };

      recognitionRef.current = recognition;
      return recognition;
    },
    [language, getCurrentContinuousTime, startTimer, stopTimer, broadcastState]
  );

  // Request explicit mic permission first to give clear feedback
  const startListening = useCallback(async () => {
    if (!SpeechRecognitionAPI) {
      setError({
        type: 'UNSUPPORTED_BROWSER',
        title: 'Browser Not Supported',
        message:
          'Your browser does not support the Web Speech API. For real-time captions, please use Google Chrome, Microsoft Edge, Brave, or another Chromium-based browser.',
      });
      return;
    }

    setError(null);
    setIsStarting(true);
    manualStopRef.current = false;

    // Check mic access via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      setIsStarting(false);
      console.warn('Microphone permission check failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          type: 'PERMISSION_DENIED',
          title: 'Microphone Permission Required',
          message:
            'You denied microphone permissions. CaptionPilot needs microphone access to transcribe your speech in real-time. Please allow microphone access in your browser settings.',
        });
        return;
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({
          type: 'NO_MIC',
          title: 'No Microphone Detected',
          message: 'No microphone was found on this device. Please connect a microphone.',
        });
        return;
      }
    }

    try {
      const recognition = initRecognition(language);
      if (recognition) {
        recognition.start();
      }
    } catch (err) {
      console.error('Failed to start SpeechRecognition:', err);
      setIsStarting(false);
      if (err.name !== 'InvalidStateError') {
        setError({
          type: 'START_ERROR',
          title: 'Failed to Start Captions',
          message: err.message || 'Could not start speech recognition service.',
        });
      }
    }
  }, [language, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    isListeningRef.current = false;
    setIsListening(false);
    setIsStarting(false);
    stopTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {
        try {
          recognitionRef.current.abort();
        } catch (_err) {
          // ignore
        }
      }
    }

    setInterimTranscript('');
    broadcastState({ isListening: false, interimText: '' });
  }, [stopTimer, broadcastState]);

  // Change language dynamically
  const changeLanguage = useCallback(
    (newLang) => {
      setLanguage(newLang);
      if (isListeningRef.current) {
        manualStopRef.current = true;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_e) {
            // ignore
          }
        }
        setTimeout(() => {
          manualStopRef.current = false;
          const recog = initRecognition(newLang);
          if (recog) {
            try {
              recog.start();
            } catch (e) {
              console.warn('Failed to switch language recognition:', e);
            }
          }
        }, 200);
      }
    },
    [initRecognition]
  );

  // Edit and update an existing segment's text
  const updateSegment = useCallback(
    (id, newText) => {
      setSegments((prev) => {
        const updated = prev.map((seg) => {
          if (seg.id === id) {
            const trimmed = newText.trim();
            return {
              ...seg,
              text: trimmed,
              isEdited: true,
              editedAt: Date.now(),
            };
          }
          return seg;
        });

        // Broadcast updated segment if it was the latest
        const latest = updated[updated.length - 1];
        if (latest && latest.id === id) {
          broadcastState({ latestSegment: latest });
        }
        return updated;
      });
    },
    [broadcastState]
  );

  // Clear all segments and reset timer
  const clearTranscript = useCallback(() => {
    setSegments([]);
    setInterimTranscript('');
    setElapsedTime(0);
    accumulatedTimeRef.current = 0;
    sessionResumeTimeRef.current = isListeningRef.current ? Date.now() : null;
    segmentStartTimeRef.current = 0;
    broadcastState({ segments: [], interimText: '', latestSegment: null });
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (_e) {
      // ignore
    }
  }, [broadcastState]);

  // Start brand new session with new name
  const startNewSession = useCallback(
    (customName) => {
      const now = new Date();
      const defaultName = `Session - ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const name = customName || defaultName;
      setSessionName(name);
      clearTranscript();
    },
    [clearTranscript]
  );

  // Remove individual segment
  const deleteSegment = useCallback((id) => {
    setSegments((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, index: idx + 1 }));
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      isListeningRef.current = false;
      stopTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_e) {
          // ignore
        }
      }
    };
  }, [stopTimer]);

  return {
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
    clearError: () => setError(null),
  };
}
