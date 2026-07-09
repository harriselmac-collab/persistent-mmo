'use client';

import { useEffect, useState } from 'react';

export const TRACKS = [
  { src: '/assets/music/main-menu-theme.mp3', name: 'Main Menu Theme' },
  { src: '/assets/music/the-battle-of-aegis.mp3', name: 'The Battle of Aegis' },
  { src: '/assets/music/legacy-of-kings.mp3', name: 'Legacy of Kings' },
  { src: '/assets/music/blacksmith-hall.mp3', name: 'Blacksmith Hall' },
  { src: '/assets/music/blacksmith-king-fight.mp3', name: 'Blacksmith King Fight' },
  { src: '/assets/music/tavern-of-the-golden-lantern.mp3', name: 'Tavern of the Golden Lantern' },
];

let globalAudio: HTMLAudioElement | null = null;
let currentTrackIndex = 0;
let isPlaying = false;
let isMuted = false;
let volume = 0.4;
let autoplayAttempted = false;

const listeners = new Set<(state: { playing: boolean; muted: boolean; track: number; volume: number }) => void>();

function notifyListeners() {
  const state = { playing: isPlaying, muted: isMuted, track: currentTrackIndex, volume };
  listeners.forEach((listener) => listener(state));
}

function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    const a = new Audio(TRACKS[0].src);
    a.volume = volume;
    a.muted = isMuted;
    a.loop = false;
    a.onended = nextTrack;
    globalAudio = a;
  }
  return globalAudio;
}

function nextTrack() {
  const a = ensureAudio();
  if (!a) return;
  currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
  a.src = TRACKS[currentTrackIndex].src;
  if (isPlaying) {
    a.play().catch(() => {});
  }
  notifyListeners();
}

export function playMusic() {
  const a = ensureAudio();
  if (!a) return;
  isPlaying = true;
  a.play().catch(() => {
    // Autoplay blocked by browser policy, will retry on interaction
  });
  notifyListeners();
}

export function pauseMusic() {
  const a = ensureAudio();
  if (!a) return;
  isPlaying = false;
  a.pause();
  notifyListeners();
}

// Setup autoplay listener on first user interaction
if (typeof window !== 'undefined') {
  const startAutoplay = () => {
    if (!autoplayAttempted) {
      autoplayAttempted = true;
      // Only autoplay if it hasn't been intentionally paused
      if (!globalAudio || globalAudio.paused) {
        playMusic();
      }
    }
    window.removeEventListener('click', startAutoplay);
    window.removeEventListener('keydown', startAutoplay);
  };
  window.addEventListener('click', startAutoplay);
  window.addEventListener('keydown', startAutoplay);
}

export function useMusic() {
  const [state, setState] = useState({
    playing: isPlaying,
    muted: isMuted,
    track: currentTrackIndex,
    volume,
  });

  useEffect(() => {
    const listener = (newState: typeof state) => {
      setState(newState);
    };
    listeners.add(listener);
    
    // Sync initial state
    setState({
      playing: isPlaying,
      muted: isMuted,
      track: currentTrackIndex,
      volume,
    });
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggle = () => {
    const a = ensureAudio();
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      isPlaying = true;
    } else {
      a.pause();
      isPlaying = false;
    }
    notifyListeners();
  };

  const toggleMute = () => {
    const a = ensureAudio();
    if (!a) return;
    a.muted = !a.muted;
    isMuted = a.muted;
    notifyListeners();
  };

  const next = () => {
    const a = ensureAudio();
    if (!a) return;
    currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
    a.src = TRACKS[currentTrackIndex].src;
    if (isPlaying) {
      a.play().catch(() => {});
    }
    notifyListeners();
  };

  const changeVolume = (val: number) => {
    const a = ensureAudio();
    if (!a) return;
    a.volume = val;
    volume = val;
    notifyListeners();
  };

  return { ...state, toggle, next, toggleMute, changeVolume };
}
