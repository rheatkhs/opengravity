import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useSettingsStore } from '../../stores/settings-store';

interface TerminalConnectionStatus {
  connected: boolean;
  error: string | null;
}

export default function TerminalComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<TerminalConnectionStatus>({ connected: false, error: null });
  const daemonUrl = useSettingsStore((s) => s.daemonUrl);

  const connectWebSocket = useCallback((term: Terminal) => {
    const wsUrl = `${daemonUrl}/terminal`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        statusRef.current = { connected: true, error: null };
        term.write('\x1b[32m● Connected to PTY daemon\x1b[0m\r\n');

        // Send initial resize
        if (fitAddonRef.current) {
          const dims = fitAddonRef.current.proposeDimensions();
          if (dims) {
            ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
          }
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        term.write(typeof event.data === 'string' ? event.data : new Uint8Array(event.data));
      };

      ws.onclose = () => {
        statusRef.current = { connected: false, error: null };
        term.write('\r\n\x1b[33m● Disconnected from PTY daemon\x1b[0m\r\n');

        // Auto-reconnect after 2s
        setTimeout(() => {
          if (terminalRef.current) {
            connectWebSocket(terminalRef.current);
          }
        }, 2000);
      };

      ws.onerror = () => {
        statusRef.current = { connected: false, error: 'Connection failed' };
        term.write('\r\n\x1b[31m● Failed to connect. Is the daemon running?\x1b[0m\r\n');
        term.write('\x1b[90m  Run: cd daemon && npm run dev\x1b[0m\r\n');
      };
    } catch {
      term.write('\x1b[31m● WebSocket error\x1b[0m\r\n');
    }
  }, [daemonUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      theme: {
        background: '#0a0a0f',
        foreground: '#e4e4e7',
        cursor: '#6366f1',
        cursorAccent: '#0a0a0f',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
        black: '#09090b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
        brightBlack: '#52525b',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#fafafa',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Pipe keystrokes to WebSocket
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Connect to daemon
    connectWebSocket(term);

    return () => {
      resizeObserver.disconnect();
      wsRef.current?.close();
      term.dispose();
    };
  }, [connectWebSocket]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ backgroundColor: '#0a0a0f' }}
    />
  );
}
