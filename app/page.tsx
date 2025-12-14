'use client';

import { useState, useCallback, useRef } from 'react';
import { SlotMachine } from './components/SlotMachine';
import { useSlotMachine } from './hooks/useSlotMachine';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useArcadeSounds } from './hooks/useArcadeSounds';
import { useTwitchCommands } from './hooks/useTwitchCommands';
import { fireJackpot, fireSmallWin, fireCoin } from './lib/confetti';

// Configuration
const TWITCH_CHANNEL = 'Habbi3';

export default function Home() {
  const [isTestMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('test') === 'true';
    }
    return false;
  });

  // Hooks
  const { play, isMuted, toggleMute } = useArcadeSounds();
  const slotMachine = useSlotMachine();
  const leaderboard = useLeaderboard();
  
  // Track if we've already handled this spin result
  const lastHandledSpinRef = useRef<string | null>(null);

  // Handle spin result (after animation completes) - with deduplication
  const handleSpinComplete = useCallback(() => {
    const result = slotMachine.currentSpin;
    if (!result) return;
    
    // Create unique ID for this spin to prevent duplicate handling
    const spinId = `${result.username}-${result.reels.map(r => r.emoji).join('')}`;
    if (lastHandledSpinRef.current === spinId) return;
    lastHandledSpinRef.current = spinId;

    // Mark spin as finished so we can spin again
    slotMachine.finishSpin();

    // Record in leaderboard
    leaderboard.recordSpin(result.username, result.tokens, result.isJackpot);

    // Fire confetti based on result - only once!
    if (result.isJackpot) {
      fireJackpot();
    } else if (result.isSmallWin) {
      fireSmallWin();
    }
    // No confetti for losing - less visual noise
  }, [slotMachine, leaderboard]);

  // Handle commands from Twitch chat
  const handleCommand = useCallback(
    ({ command, username, color, isBroadcaster }: { 
      command: string; 
      args: string[];
      username: string; 
      color: string; 
      isBroadcaster: boolean;
      isMod: boolean;
    }) => {
      switch (command) {
        case 'spin':
          if (slotMachine.canSpin()) {
            slotMachine.spin(username, color);
          }
          break;

        case 'resetslots':
          if (isBroadcaster) {
            leaderboard.reset();
            console.log('🎰 Leaderboard reset by broadcaster');
          }
          break;
      }
    },
    [slotMachine, leaderboard]
  );

  // Connect to Twitch
  useTwitchCommands({
    channel: isTestMode ? '' : TWITCH_CHANNEL,
    onCommand: isTestMode ? undefined : handleCommand,
  });

  // Test mode functions
  const testSpin = useCallback(() => {
    if (slotMachine.canSpin()) {
      const testUsers = ['TestPlayer', 'LuckyGamer', 'SlotFan', 'ArcadeKing', 'RetroQueen'];
      const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
      const randomColor = testColors[Math.floor(Math.random() * testColors.length)];
      slotMachine.spin(randomUser, randomColor);
    }
  }, [slotMachine]);

  const testReset = useCallback(() => {
    leaderboard.reset();
  }, [leaderboard]);

  return (
    <main className="min-h-screen">
      {/* Test Mode Controls */}
      {isTestMode && (
        <div className="test-controls">
          <button onClick={testSpin} className="test-btn">
            TEST SPIN
          </button>
          <button onClick={testReset} className="test-btn reset">
            RESET
          </button>
        </div>
      )}

      {/* Slot Machine Widget with integrated leaderboard */}
      <SlotMachine
        currentSpin={slotMachine.currentSpin}
        isSpinning={slotMachine.isSpinning}
        cooldownRemaining={slotMachine.cooldownRemaining}
        cooldownTotal={slotMachine.cooldownTotal}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onSpinComplete={handleSpinComplete}
        onPlaySound={play}
        topPlayers={leaderboard.getTopPlayers(3)}
      />
    </main>
  );
}
