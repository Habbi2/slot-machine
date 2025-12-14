'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { PlayerStats } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  isOpen: boolean;
  onToggle: () => void;
  topPlayers: PlayerStats[];
  totalStats: {
    totalPlayers: number;
    totalSpins: number;
    totalTokens: number;
    totalJackpots: number;
  };
}

export function Leaderboard({ isOpen, onToggle, topPlayers, totalStats }: LeaderboardProps) {
  return (
    <div className="leaderboard-container">
      {/* Toggle button */}
      <button onClick={onToggle} className="leaderboard-toggle">
        🏆 {isOpen ? '▼' : '▲'}
      </button>

      {/* Leaderboard panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="leaderboard-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="leaderboard-header">
              <span className="leaderboard-title">🏆 LEADERBOARD 🏆</span>
            </div>

            {/* Top players list */}
            <div className="leaderboard-list">
              {topPlayers.length === 0 ? (
                <div className="no-players">No spins yet!</div>
              ) : (
                topPlayers.map((player, index) => (
                  <div key={player.username} className="leaderboard-row">
                    <span className="rank">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </span>
                    <span className="player-name">{player.username}</span>
                    <span className="player-tokens">{player.tokens}🪙</span>
                    {player.jackpots > 0 && (
                      <span className="player-jackpots">{player.jackpots}🎰</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Total stats */}
            <div className="leaderboard-footer">
              <div className="stat">
                <span className="stat-label">Players</span>
                <span className="stat-value">{totalStats.totalPlayers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Spins</span>
                <span className="stat-value">{totalStats.totalSpins}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Jackpots</span>
                <span className="stat-value">{totalStats.totalJackpots}🎰</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
