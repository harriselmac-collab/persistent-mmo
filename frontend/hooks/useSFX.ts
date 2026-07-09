'use client';

import { useEffect, useState } from 'react';

let isSFXEnabled = true;

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('aegis_sfx_enabled');
  if (saved !== null) {
    isSFXEnabled = saved === 'true';
  }
}

const listeners = new Set<(enabled: boolean) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(isSFXEnabled));
}

export function toggleSFX() {
  isSFXEnabled = !isSFXEnabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('aegis_sfx_enabled', String(isSFXEnabled));
  }
  notifyListeners();
}

export function setSFX(enabled: boolean) {
  isSFXEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('aegis_sfx_enabled', String(isSFXEnabled));
  }
  notifyListeners();
}

// Sound Synthesis Functions
function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

function playSynthesizedSound(type: 'click' | 'open' | 'close' | 'success' | 'travel' | 'error') {
  if (!isSFXEnabled) return;
  const ctx = createAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.15, now); // comfortable volume ceiling

  if (type === 'click') {
    // Short high-pitched sine beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.045);
  } else if (type === 'open') {
    // Upward sweep triangle wave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.125);
  } else if (type === 'close') {
    // Downward sweep triangle wave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.125);
  } else if (type === 'success') {
    // Rapid C-E-G-C major triad chime block
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, noteTime + 0.12);
      
      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.005, noteTime + 0.15);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  } else if (type === 'travel') {
    // Teleport swoop (FM synthesis sweep)
    const duration = 0.5;
    const osc = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + duration);
    
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(50, now);
    modulator.frequency.linearRampToValueAtTime(8, now + duration);
    
    modGain.gain.setValueAtTime(120, now);
    modGain.gain.linearRampToValueAtTime(3, now + duration);
    
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);
    
    modulator.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(masterGain);
    
    modulator.start(now);
    osc.start(now);
    modulator.stop(now + duration);
    osc.stop(now + duration);
  } else if (type === 'error') {
    // Low double square-wave buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.setValueAtTime(122, now + 0.08);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export function useSFX() {
  const [enabled, setEnabled] = useState(isSFXEnabled);

  useEffect(() => {
    const listener = (newEnabled: boolean) => {
      setEnabled(newEnabled);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    enabled,
    toggle: toggleSFX,
    playClick: () => playSynthesizedSound('click'),
    playOpen: () => playSynthesizedSound('open'),
    playClose: () => playSynthesizedSound('close'),
    playSuccess: () => playSynthesizedSound('success'),
    playTravel: () => playSynthesizedSound('travel'),
    playError: () => playSynthesizedSound('error'),
  };
}
