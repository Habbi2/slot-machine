'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SpinResult, Symbol } from '../hooks/useSlotMachine';
import type { PlayerStats } from '../hooks/useLeaderboard';

// All possible symbols for spinning animation
const ALL_SYMBOLS = ['🍒', '🍋', '🔔', '7️⃣', '⭐', '💎'];

interface SlotMachineProps {
  currentSpin: SpinResult | null;
  isSpinning: boolean;
  cooldownRemaining: number;
  cooldownTotal: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onSpinComplete: () => void;
  onPlaySound: (sound: 'spin' | 'tick' | 'smallWin' | 'jackpot' | 'coin') => void;
  topPlayers: PlayerStats[];
}

interface ReelProps {
  finalSymbol: Symbol | null;
  isSpinning: boolean;
  delay: number;
  onStop: () => void;
  onPlayTick: () => void;
}

function Reel({ finalSymbol, isSpinning, delay, onStop, onPlayTick }: ReelProps) {
  const [displaySymbol, setDisplaySymbol] = useState('🎰');
  const [spinning, setSpinning] = useState(false);
  const onStopRef = useRef(onStop);
  const onPlayTickRef = useRef(onPlayTick);
  
  useEffect(() => {
    onStopRef.current = onStop;
    onPlayTickRef.current = onPlayTick;
  }, [onStop, onPlayTick]);

  useEffect(() => {
    if (!isSpinning) return;
    
    setSpinning(true);
    
    const spinDuration = 1500 + delay;
    const intervalTime = 80;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += intervalTime;
      
      const randomIndex = Math.floor(Math.random() * ALL_SYMBOLS.length);
      setDisplaySymbol(ALL_SYMBOLS[randomIndex]);

      if (elapsed >= spinDuration) {
        clearInterval(interval);
        if (finalSymbol) {
          setDisplaySymbol(finalSymbol.emoji);
        }
        setSpinning(false);
        onPlayTickRef.current();
        onStopRef.current();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isSpinning, finalSymbol, delay]);

  return (
    <div className="reel-container">
      <motion.div
        className="reel"
        animate={spinning ? { y: [0, -10, 0] } : {}}
        transition={spinning ? { duration: 0.1, repeat: Infinity } : {}}
      >
        <span className="text-5xl">{displaySymbol}</span>
      </motion.div>
    </div>
  );
}

export function SlotMachine({
  currentSpin,
  isSpinning,
  cooldownRemaining,
  cooldownTotal,
  isMuted,
  onToggleMute,
  onSpinComplete,
  onPlaySound,
  topPlayers,
}: SlotMachineProps) {
  const [reelsStopped, setReelsStopped] = useState([false, false, false]);
  const [showResult, setShowResult] = useState(false);
  const hasCompletedRef = useRef(false);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const onPlaySoundRef = useRef(onPlaySound);

  // Keep refs updated
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
    onPlaySoundRef.current = onPlaySound;
  }, [onSpinComplete, onPlaySound]);

  // Reset when new spin starts
  useEffect(() => {
    if (isSpinning) {
      setReelsStopped([false, false, false]);
      setShowResult(false);
      hasCompletedRef.current = false;
      onPlaySoundRef.current('spin');
    }
  }, [isSpinning]);

  // Check if all reels stopped - only fire once
  useEffect(() => {
    if (reelsStopped.every(Boolean) && currentSpin && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      
      const timer = setTimeout(() => {
        setShowResult(true);
        
        if (currentSpin.isJackpot) {
          onPlaySoundRef.current('jackpot');
        } else if (currentSpin.isSmallWin) {
          onPlaySoundRef.current('smallWin');
        } else {
          onPlaySoundRef.current('coin');
        }
        
        onSpinCompleteRef.current();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [reelsStopped, currentSpin]);

  const handleReelStop = (index: number) => {
    setReelsStopped((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const cooldownPercent = cooldownTotal > 0 ? (cooldownRemaining / cooldownTotal) * 100 : 0;

  return (
    <div className="slot-machine">
      {/* Cabinet top */}
      <div className="cabinet-top">
        <span className="cabinet-title">🎰 SLOTS 🎰</span>
        <button
          onClick={onToggleMute}
          className="mute-button"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Reels container */}
      <div className="reels-container">
        <Reel
          finalSymbol={currentSpin?.reels[0] || null}
          isSpinning={isSpinning}
          delay={0}
          onStop={() => handleReelStop(0)}
          onPlayTick={() => onPlaySoundRef.current('tick')}
        />
        <Reel
          finalSymbol={currentSpin?.reels[1] || null}
          isSpinning={isSpinning}
          delay={300}
          onStop={() => handleReelStop(1)}
          onPlayTick={() => onPlaySoundRef.current('tick')}
        />
        <Reel
          finalSymbol={currentSpin?.reels[2] || null}
          isSpinning={isSpinning}
          delay={600}
          onStop={() => handleReelStop(2)}
          onPlayTick={() => onPlaySoundRef.current('tick')}
        />
      </div>

      {/* Result display */}
      <AnimatePresence>
        {showResult && currentSpin && (
          <motion.div
            className="result-display"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div
              className="spinner-name"
              style={{ color: currentSpin.color }}
            >
              {currentSpin.username}
            </div>
            <div className={`result-text ${currentSpin.isJackpot ? 'jackpot' : currentSpin.isSmallWin ? 'small-win' : 'lose'}`}>
              {currentSpin.isJackpot && '🎉 JACKPOT! 🎉'}
              {currentSpin.isSmallWin && '✨ WIN! ✨'}
              {!currentSpin.isJackpot && !currentSpin.isSmallWin && '😢 TRY AGAIN'}
            </div>
            <div className="tokens-earned">
              +{currentSpin.tokens}🪙
              {currentSpin.hasBonus && <span className="bonus-text"> (2x BONUS!)</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cooldown bar */}
      <div className="cooldown-container">
        <div className="cooldown-bar">
          <motion.div
            className="cooldown-fill"
            initial={{ width: '100%' }}
            animate={{ width: `${cooldownPercent}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="cooldown-text">
          {cooldownRemaining > 0
            ? `⏱️ ${(cooldownRemaining / 1000).toFixed(1)}s`
            : '✅ Type !spin'}
        </div>
      </div>

      {/* Integrated Leaderboard */}
      <div className="integrated-leaderboard">
        <div className="lb-header">🏆 TOP PLAYERS</div>
        {topPlayers.length === 0 ? (
          <div className="lb-empty">No spins yet!</div>
        ) : (
          <div className="lb-rows">
            {topPlayers.slice(0, 3).map((player, index) => (
              <div key={player.username} className="lb-row">
                <span className="lb-rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                </span>
                <span className="lb-name">{player.username}</span>
                <span className="lb-tokens">{player.tokens}🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions">
        Type <span>!spin</span> to play
      </div>
    </div>
  );
}
