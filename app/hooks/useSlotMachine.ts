'use client';

import { useState, useCallback, useRef } from 'react';

// Symbols with their weights (higher = more common)
const SYMBOLS = [
  { emoji: '🍒', name: 'cherry', weight: 25 },
  { emoji: '🍋', name: 'lemon', weight: 25 },
  { emoji: '🔔', name: 'bell', weight: 20 },
  { emoji: '7️⃣', name: 'seven', weight: 15 },
  { emoji: '⭐', name: 'wild', weight: 10, isWild: true },
  { emoji: '💎', name: 'diamond', weight: 5, isBonus: true },
];

// Build weighted array for random selection
const WEIGHTED_SYMBOLS: typeof SYMBOLS = [];
SYMBOLS.forEach((symbol) => {
  for (let i = 0; i < symbol.weight; i++) {
    WEIGHTED_SYMBOLS.push(symbol);
  }
});

export type Symbol = (typeof SYMBOLS)[number];
export type SpinResult = {
  id: number; // Unique ID for each spin
  reels: [Symbol, Symbol, Symbol];
  isJackpot: boolean;
  isSmallWin: boolean;
  hasBonus: boolean;
  tokens: number;
  username: string;
  color: string;
};

const COOLDOWN_MS = 5000; // 5 second global cooldown

// Token payouts
const JACKPOT_TOKENS = 100;
const SMALL_WIN_TOKENS = 10;
const LOSE_TOKENS = 1;
const BONUS_MULTIPLIER = 2;

export function useSlotMachine() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpin, setCurrentSpin] = useState<SpinResult | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSpinTimeRef = useRef(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinCounterRef = useRef(0);

  // Get random symbol using weighted selection
  const getRandomSymbol = useCallback((): Symbol => {
    const index = Math.floor(Math.random() * WEIGHTED_SYMBOLS.length);
    return WEIGHTED_SYMBOLS[index];
  }, []);

  // Check if symbols match (considering wilds)
  const symbolsMatch = useCallback((a: Symbol, b: Symbol): boolean => {
    if (a.isWild || b.isWild) return true;
    return a.name === b.name;
  }, []);

  // Calculate win and tokens
  const calculateResult = useCallback(
    (reels: [Symbol, Symbol, Symbol], username: string, color: string): SpinResult => {
      const [r1, r2, r3] = reels;

      // Check for jackpot (all 3 match)
      const isJackpot = symbolsMatch(r1, r2) && symbolsMatch(r2, r3) && symbolsMatch(r1, r3);

      // Check for small win (any 2 adjacent match)
      const isSmallWin = !isJackpot && (symbolsMatch(r1, r2) || symbolsMatch(r2, r3));

      // Check for bonus symbol in winning combo
      const hasBonus = (isJackpot || isSmallWin) && reels.some((r) => r.isBonus);

      // Calculate tokens
      let tokens = LOSE_TOKENS;
      if (isJackpot) {
        tokens = JACKPOT_TOKENS;
      } else if (isSmallWin) {
        tokens = SMALL_WIN_TOKENS;
      }

      // Apply bonus multiplier
      if (hasBonus) {
        tokens *= BONUS_MULTIPLIER;
      }

      return { id: 0, reels, isJackpot, isSmallWin, hasBonus, tokens, username, color };
    },
    [symbolsMatch]
  );

  // Start cooldown timer
  const startCooldown = useCallback(() => {
    lastSpinTimeRef.current = Date.now();
    setCooldownRemaining(COOLDOWN_MS);

    // Clear existing interval
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    // Update cooldown every 100ms
    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSpinTimeRef.current;
      const remaining = Math.max(0, COOLDOWN_MS - elapsed);
      setCooldownRemaining(remaining);

      if (remaining === 0 && cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    }, 100);
  }, []);

  // Check if can spin (not on cooldown)
  const canSpin = useCallback((): boolean => {
    if (isSpinning) return false;
    const elapsed = Date.now() - lastSpinTimeRef.current;
    return elapsed >= COOLDOWN_MS;
  }, [isSpinning]);

  // Spin the slot machine
  const spin = useCallback(
    (username: string, color: string): SpinResult | null => {
      if (!canSpin()) return null;

      // Increment spin counter for unique ID
      spinCounterRef.current += 1;

      setIsSpinning(true);

      // Generate random reels
      const reels: [Symbol, Symbol, Symbol] = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol(),
      ];

      const result = calculateResult(reels, username, color);
      setCurrentSpin({ ...result, id: spinCounterRef.current });

      // Start cooldown
      startCooldown();

      return result;
    },
    [canSpin, getRandomSymbol, calculateResult, startCooldown]
  );

  // Called when spin animation completes
  const finishSpin = useCallback(() => {
    setIsSpinning(false);
  }, []);

  // Clear current result
  const clearResult = useCallback(() => {
    setCurrentSpin(null);
  }, []);

  return {
    spin,
    finishSpin,
    clearResult,
    canSpin,
    isSpinning,
    currentSpin,
    cooldownRemaining,
    cooldownTotal: COOLDOWN_MS,
    symbols: SYMBOLS,
  };
}
