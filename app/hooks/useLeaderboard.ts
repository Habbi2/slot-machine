'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'slot-machine-leaderboard';

export interface PlayerStats {
  username: string;
  spins: number;
  tokens: number;
  jackpots: number;
  lastPlayed: number;
}

export interface Leaderboard {
  [username: string]: PlayerStats;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setLeaderboard(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever leaderboard changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard));
      } catch (e) {
        console.error('Failed to save leaderboard:', e);
      }
    }
  }, [leaderboard, isLoaded]);

  // Add spin result to leaderboard
  const recordSpin = useCallback(
    (username: string, tokens: number, isJackpot: boolean) => {
      setLeaderboard((prev) => {
        const existing = prev[username] || {
          username,
          spins: 0,
          tokens: 0,
          jackpots: 0,
          lastPlayed: 0,
        };

        return {
          ...prev,
          [username]: {
            ...existing,
            spins: existing.spins + 1,
            tokens: existing.tokens + tokens,
            jackpots: existing.jackpots + (isJackpot ? 1 : 0),
            lastPlayed: Date.now(),
          },
        };
      });
    },
    []
  );

  // Get top players sorted by tokens
  const getTopPlayers = useCallback(
    (limit = 5): PlayerStats[] => {
      return Object.values(leaderboard)
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, limit);
    },
    [leaderboard]
  );

  // Get player stats
  const getPlayer = useCallback(
    (username: string): PlayerStats | null => {
      return leaderboard[username] || null;
    },
    [leaderboard]
  );

  // Reset entire leaderboard
  const reset = useCallback(() => {
    setLeaderboard({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Get total stats
  const getTotalStats = useCallback(() => {
    const players = Object.values(leaderboard);
    return {
      totalPlayers: players.length,
      totalSpins: players.reduce((sum, p) => sum + p.spins, 0),
      totalTokens: players.reduce((sum, p) => sum + p.tokens, 0),
      totalJackpots: players.reduce((sum, p) => sum + p.jackpots, 0),
    };
  }, [leaderboard]);

  return {
    leaderboard,
    isLoaded,
    recordSpin,
    getTopPlayers,
    getPlayer,
    reset,
    getTotalStats,
  };
}
