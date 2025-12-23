'use client';

import { useEffect, useRef, useCallback } from 'react';
import tmi from 'tmi.js';

interface CommandInfo {
  command: string;
  args: string[];
  username: string;
  color: string;
  isBroadcaster: boolean;
  isMod: boolean;
  isChannelPointRedemption: boolean;
  rewardId?: string;
}

interface UseTwitchCommandsOptions {
  channel: string;
  channelPointRewardId?: string; // ID of the channel point reward for spinning
  onCommand?: (info: CommandInfo) => void;
  onChannelPointRedemption?: (info: CommandInfo) => void;
}

export function useTwitchCommands({ channel, channelPointRewardId, onCommand, onChannelPointRedemption }: UseTwitchCommandsOptions) {
  const clientRef = useRef<tmi.Client | null>(null);
  const callbackRef = useRef(onCommand);
  const redemptionCallbackRef = useRef(onChannelPointRedemption);
  const rewardIdRef = useRef(channelPointRewardId);

  useEffect(() => {
    callbackRef.current = onCommand;
    redemptionCallbackRef.current = onChannelPointRedemption;
    rewardIdRef.current = channelPointRewardId;
  }, [onCommand, onChannelPointRedemption, channelPointRewardId]);

  const connect = useCallback(() => {
    if (!channel) return;

    const client = new tmi.Client({
      channels: [channel],
      connection: {
        secure: true,
        reconnect: true,
      },
    });

    client.on('message', (_channel, tags, message, self) => {
      if (self) return;

      // Extract user info
      const username = tags['display-name'] || tags.username || 'Anonymous';
      const color = tags.color || '#FFFFFF';
      const isBroadcaster = tags.badges?.broadcaster === '1';
      const isMod = tags.mod || false;

      // Check for channel point redemption
      const customRewardId = tags['custom-reward-id'];
      const isChannelPointRedemption = !!customRewardId;

      // If this is a channel point redemption for our spin reward
      if (isChannelPointRedemption && rewardIdRef.current && customRewardId === rewardIdRef.current) {
        console.log(`🎰 Channel point redemption by ${username}`);
        redemptionCallbackRef.current?.({
          command: 'spin',
          args: [],
          username,
          color,
          isBroadcaster,
          isMod,
          isChannelPointRedemption: true,
          rewardId: customRewardId,
        });
        return;
      }

      // Only process commands (messages starting with !)
      const trimmed = message.trim();
      if (!trimmed.startsWith('!')) return;

      // Parse command and arguments
      const parts = trimmed.slice(1).split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      callbackRef.current?.({
        command,
        args,
        username,
        color,
        isBroadcaster,
        isMod,
        isChannelPointRedemption: false,
      });
    });

    client.on('connected', () => {
      console.log(`🎰 Connected to ${channel} for commands`);
    });

    client.connect().catch(console.error);
    clientRef.current = client;
  }, [channel]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
