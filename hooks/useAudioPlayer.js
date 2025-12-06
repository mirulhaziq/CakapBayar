import { useState, useRef, useCallback } from 'react';

// Global audio context for iOS compatibility
let audioContextUnlocked = false;

export function unlockAudioPlayback() {
  if (audioContextUnlocked) return;
  
  // Create a silent audio context to unlock audio on iOS
  if (typeof window !== 'undefined') {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    audio.play().catch(() => {});
    audioContextUnlocked = true;
  }
}

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const playAudio = useCallback(async (audioBlob) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      audio.src = url;

      // Handle playback events
      audio.onplay = () => {
        setIsPlaying(true);
        setError(null);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        setIsPlaying(false);
        setError('Audio playback failed');
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      // Store reference
      audioRef.current = audio;

      // Play audio
      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
      setError(err.message || 'Failed to play audio');
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      audioRef.current = null;
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    isPlaying,
    error,
    unlockAudioPlayback,
  };
}

