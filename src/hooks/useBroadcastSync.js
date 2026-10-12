import { useState, useEffect, useRef } from 'react';
import { BROADCAST_CHANNEL_NAME, STORAGE_KEY_CURRENT } from '../utils/constants';

function getInitialCachedState() {
  if (typeof window === 'undefined') {
    return { text: '', interim: false, listening: false };
  }
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.interimText) {
        return { text: parsed.interimText, interim: true, listening: !!parsed.isListening };
      }
      if (parsed.latestSegment?.text) {
        return { text: parsed.latestSegment.text, interim: false, listening: !!parsed.isListening };
      }
      return { text: '', interim: false, listening: !!parsed.isListening };
    }
  } catch (_e) {
    // Ignore storage parse issues
  }
  return { text: '', interim: false, listening: false };
}

export function useBroadcastSync() {
  const initial = getInitialCachedState();
  const [activeText, setActiveText] = useState(initial.text);
  const [isInterim, setIsInterim] = useState(initial.interim);
  const [isListening, setIsListening] = useState(initial.listening);
  const hideTimerRef = useRef(null);

  const resetHideTimer = (delayMs = 4500) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setActiveText('');
      setIsInterim(false);
    }, delayMs);
  };

  useEffect(() => {
    // 1. Listen via BroadcastChannel
    let channel;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          setIsListening(!!data.isListening);

          if (data.interimText && data.interimText.trim().length > 0) {
            setActiveText(data.interimText);
            setIsInterim(true);
            resetHideTimer(6000);
          } else if (data.latestSegment && data.latestSegment.text) {
            setActiveText(data.latestSegment.text);
            setIsInterim(false);
            resetHideTimer(4500);
          } else if (data.isListening === false) {
            resetHideTimer(2000);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel error in overlay:', err);
      }
    }

    // 2. Cross-window storage event listener fallback
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY_CURRENT && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setIsListening(!!data.isListening);
          if (data.interimText) {
            setActiveText(data.interimText);
            setIsInterim(true);
            resetHideTimer(6000);
          } else if (data.latestSegment?.text) {
            setActiveText(data.latestSegment.text);
            setIsInterim(false);
            resetHideTimer(4500);
          }
        } catch (_err) {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return {
    activeText,
    isInterim,
    isListening,
  };
}
