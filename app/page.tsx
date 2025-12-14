'use client';

import { useState, useCallback } from 'react';
import { SlotMachine } from './components/SlotMachine';
import { Leaderboard } from './components/Leaderboard';
import { useSlotMachine } from './hooks/useSlotMachine';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useArcadeSounds } from './hooks/useArcadeSounds';
import { useTwitchCommands } from './hooks/useTwitchCommands';
import { fireJackpot, fireSmallWin, fireCoin } from './lib/confetti';

// Configuration
const TWITCH_CHANNEL = 'Habbi3';

export default function Home() {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
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

  // Handle spin result (after animation completes)
  const handleSpinComplete = useCallback(() => {
    const result = slotMachine.currentSpin;
    if (!result) return;

    // Record in leaderboard
    leaderboard.recordSpin(result.username, result.tokens, result.isJackpot);

    // Fire confetti based on result
    if (result.isJackpot) {
      fireJackpot();
    } else if (result.isSmallWin) {
      fireSmallWin();
    } else {
      fireCoin();
    }
  }, [slotMachine.currentSpin, leaderboard]);

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

        case 'leaderboard':
        case 'lb':
        case 'top':
          setIsLeaderboardOpen((prev) => !prev);
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

  // Connect to Twitch (disabled in test mode to avoid interference)
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

      {/* Slot Machine Widget */}
      <SlotMachine
        currentSpin={slotMachine.currentSpin}
        isSpinning={slotMachine.isSpinning}
        cooldownRemaining={slotMachine.cooldownRemaining}
        cooldownTotal={slotMachine.cooldownTotal}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onSpinComplete={handleSpinComplete}
        onPlaySound={play}
      />

      {/* Leaderboard Widget */}
      <Leaderboard
        isOpen={isLeaderboardOpen}
        onToggle={() => setIsLeaderboardOpen((prev) => !prev)}
        topPlayers={leaderboard.getTopPlayers(5)}
        totalStats={leaderboard.getTotalStats()}
      />
    </main>
  );
}
