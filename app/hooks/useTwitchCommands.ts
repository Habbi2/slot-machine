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
}

interface UseTwitchCommandsOptions {
  channel: string;
  onCommand?: (info: CommandInfo) => void;
}

export function useTwitchCommands({ channel, onCommand }: UseTwitchCommandsOptions) {
  const clientRef = useRef<tmi.Client | null>(null);
  const callbackRef = useRef(onCommand);

  useEffect(() => {
    callbackRef.current = onCommand;
  }, [onCommand]);

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

      // Only process commands (messages starting with !)
      const trimmed = message.trim();
      if (!trimmed.startsWith('!')) return;

      // Parse command and arguments
      const parts = trimmed.slice(1).split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Extract user info
      const username = tags['display-name'] || tags.username || 'Anonymous';
      const color = tags.color || '#FFFFFF';
      const isBroadcaster = tags.badges?.broadcaster === '1';
      const isMod = tags.mod || false;

      callbackRef.current?.({
        command,
        args,
        username,
        color,
        isBroadcaster,
        isMod,
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
