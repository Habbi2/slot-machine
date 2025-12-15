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
  isMegaJackpot: boolean;
  isSuperJackpot: boolean;
  isSmallWin: boolean;
  hasBonus: boolean;
  tokens: number;
  baseTokens: number;
  multiplier: number;
  multiplierLabel: string;
  winType: string;
  username: string;
  color: string;
};

const COOLDOWN_MS = 5000; // 5 second global cooldown

// Token payouts
const PAYOUTS = {
  // Jackpot tiers (all 3 match)
  MEGA_JACKPOT: 500,    // 3 diamonds 💎💎💎
  SUPER_JACKPOT: 250,   // 3 sevens 7️⃣7️⃣7️⃣
  JACKPOT: 100,         // Any 3 matching
  
  // Partial wins
  THREE_WILDS: 150,     // 3 wilds ⭐⭐⭐
  TWO_MATCH: 10,        // 2 adjacent match
  TWO_WILDS: 25,        // 2 wilds anywhere
  SINGLE_DIAMOND: 5,    // Any diamond in spin
  SINGLE_SEVEN: 3,      // Any seven in spin
  
  // Consolation
  LOSE: 1,              // Participation token
};

// Random multipliers with weights
const MULTIPLIERS = [
  { value: 1, weight: 60, label: '' },           // No multiplier (most common)
  { value: 2, weight: 20, label: '2x!' },        // Double
  { value: 3, weight: 10, label: '3x!' },        // Triple
  { value: 5, weight: 6, label: '5x!!' },        // 5x
  { value: 10, weight: 3, label: '10x!!!' },     // 10x (rare)
  { value: 25, weight: 1, label: '🔥 25x MEGA!' }, // 25x (super rare)
];

// Build weighted multiplier array
const WEIGHTED_MULTIPLIERS: typeof MULTIPLIERS = [];
MULTIPLIERS.forEach((mult) => {
  for (let i = 0; i < mult.weight; i++) {
    WEIGHTED_MULTIPLIERS.push(mult);
  }
});

// Get random multiplier
const getRandomMultiplier = () => {
  const index = Math.floor(Math.random() * WEIGHTED_MULTIPLIERS.length);
  return WEIGHTED_MULTIPLIERS[index];
};

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

      // Count symbol types
      const wildCount = reels.filter((r) => r.isWild).length;
      const diamondCount = reels.filter((r) => r.isBonus).length;
      const sevenCount = reels.filter((r) => r.name === 'seven').length;

      // Check for jackpot (all 3 match)
      const allMatch = symbolsMatch(r1, r2) && symbolsMatch(r2, r3) && symbolsMatch(r1, r3);
      
      // Determine specific jackpot type
      const isMegaJackpot = diamondCount === 3; // 💎💎💎
      const isSuperJackpot = !isMegaJackpot && sevenCount === 3; // 7️⃣7️⃣7️⃣
      const isThreeWilds = wildCount === 3; // ⭐⭐⭐
      const isJackpot = allMatch && !isMegaJackpot && !isSuperJackpot && !isThreeWilds;

      // Check for small win (any 2 adjacent match)
      const hasTwoMatch = !allMatch && (symbolsMatch(r1, r2) || symbolsMatch(r2, r3));
      const hasTwoWilds = wildCount === 2;
      const hasSingleDiamond = diamondCount >= 1 && !isMegaJackpot;
      const hasSingleSeven = sevenCount >= 1 && !isSuperJackpot && !hasTwoMatch && !allMatch;

      // Check for bonus symbol in winning combo
      const hasBonus = allMatch && diamondCount > 0 && !isMegaJackpot;
      
      // Determine if it's a small win
      const isSmallWin = hasTwoMatch || hasTwoWilds || hasSingleDiamond || hasSingleSeven;

      // Calculate base tokens based on win type
      let baseTokens = PAYOUTS.LOSE;
      let winType = 'Better luck next time!';

      if (isMegaJackpot) {
        baseTokens = PAYOUTS.MEGA_JACKPOT;
        winType = '💎💎💎 MEGA JACKPOT!!!';
      } else if (isSuperJackpot) {
        baseTokens = PAYOUTS.SUPER_JACKPOT;
        winType = '7️⃣7️⃣7️⃣ SUPER JACKPOT!!';
      } else if (isThreeWilds) {
        baseTokens = PAYOUTS.THREE_WILDS;
        winType = '⭐⭐⭐ WILD JACKPOT!';
      } else if (isJackpot) {
        baseTokens = PAYOUTS.JACKPOT;
        winType = '🎰 JACKPOT!';
      } else if (hasTwoWilds) {
        baseTokens = PAYOUTS.TWO_WILDS;
        winType = '⭐⭐ Double Wilds!';
      } else if (hasTwoMatch) {
        baseTokens = PAYOUTS.TWO_MATCH;
        winType = '✨ Two of a kind!';
      } else if (hasSingleDiamond) {
        baseTokens = PAYOUTS.SINGLE_DIAMOND;
        winType = '💎 Diamond bonus!';
      } else if (hasSingleSeven) {
        baseTokens = PAYOUTS.SINGLE_SEVEN;
        winType = '7️⃣ Lucky seven!';
      }

      // Apply bonus multiplier for diamonds in jackpots
      if (hasBonus) {
        baseTokens = Math.floor(baseTokens * 1.5);
        winType += ' +💎 Bonus!';
      }

      // Get random multiplier (only applies to wins)
      const mult = (baseTokens > PAYOUTS.LOSE) ? getRandomMultiplier() : { value: 1, label: '' };
      const tokens = baseTokens * mult.value;

      return { 
        id: 0, 
        reels, 
        isJackpot: isJackpot || isMegaJackpot || isSuperJackpot || isThreeWilds, 
        isMegaJackpot,
        isSuperJackpot,
        isSmallWin, 
        hasBonus, 
        tokens, 
        baseTokens,
        multiplier: mult.value,
        multiplierLabel: mult.label,
        winType,
        username, 
        color 
      };
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
