'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SoundType = 'spin' | 'tick' | 'smallWin' | 'jackpot' | 'coin';

const MUTE_KEY = 'slot-machine-muted';

export function useArcadeSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Load mute preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MUTE_KEY);
      setIsMuted(saved === 'true');
    }
  }, []);

  // Get or create AudioContext
  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Play an oscillator note
  const playNote = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'square', delay = 0) => {
      if (isMuted) return;

      const ctx = getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + duration);
    },
    [isMuted, getContext]
  );

  // Spin sound - descending tones that speed up
  const playSpin = useCallback(() => {
    if (isMuted) return;
    const notes = [440, 392, 349, 330, 294, 262, 247, 220];
    notes.forEach((freq, i) => {
      playNote(freq, 0.08, 'square', i * 0.06);
    });
  }, [isMuted, playNote]);

  // Tick sound - single click for reel stop
  const playTick = useCallback(() => {
    if (isMuted) return;
    playNote(800, 0.05, 'square');
  }, [isMuted, playNote]);

  // Small win - happy ascending arpeggio
  const playSmallWin = useCallback(() => {
    if (isMuted) return;
    const notes = [262, 330, 392, 523];
    notes.forEach((freq, i) => {
      playNote(freq, 0.15, 'square', i * 0.1);
    });
  }, [isMuted, playNote]);

  // Jackpot - triumphant fanfare
  const playJackpot = useCallback(() => {
    if (isMuted) return;
    // Fanfare melody
    const melody = [
      { freq: 392, dur: 0.1, delay: 0 },
      { freq: 392, dur: 0.1, delay: 0.1 },
      { freq: 392, dur: 0.1, delay: 0.2 },
      { freq: 523, dur: 0.4, delay: 0.3 },
      { freq: 440, dur: 0.1, delay: 0.5 },
      { freq: 494, dur: 0.1, delay: 0.6 },
      { freq: 523, dur: 0.4, delay: 0.7 },
    ];
    melody.forEach(({ freq, dur, delay }) => {
      playNote(freq, dur, 'square', delay);
    });
  }, [isMuted, playNote]);

  // Coin sound - classic coin collect
  const playCoin = useCallback(() => {
    if (isMuted) return;
    playNote(988, 0.1, 'square', 0);
    playNote(1319, 0.2, 'square', 0.1);
  }, [isMuted, playNote]);

  // Play any sound by type
  const play = useCallback(
    (type: SoundType) => {
      switch (type) {
        case 'spin':
          playSpin();
          break;
        case 'tick':
          playTick();
          break;
        case 'smallWin':
          playSmallWin();
          break;
        case 'jackpot':
          playJackpot();
          break;
        case 'coin':
          playCoin();
          break;
      }
    },
    [playSpin, playTick, playSmallWin, playJackpot, playCoin]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(MUTE_KEY, String(newValue));
      }
      return newValue;
    });
  }, []);

  return { play, isMuted, toggleMute };
}
