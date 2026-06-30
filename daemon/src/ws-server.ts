import { createServer, type IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { PtyManager } from './pty-manager.js';
import { RpcHandler, type JsonRpcRequest, type JsonRpcResponse } from './rpc-handler.js';
import { log } from './utils.js';

export interface WsServerOptions {
  port: number;
  host?: string;
}

/**
 * WebSocket server that exposes two endpoints:
 * - /terminal  → Raw bidirectional PTY stream for xterm.js
 * - /rpc       → JSON-RPC channel for agent command execution
 */
export class WsServer {
  private httpServer: ReturnType<typeof createServer>;
  private terminalWss: WebSocketServer;
  private rpcWss: WebSocketServer;
  private ptyManager: PtyManager;
  private rpcHandler: RpcHandler;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ptyManager: PtyManager) {
    this.ptyManager = ptyManager;
    this.rpcHandler = new RpcHandler(ptyManager);

    // Create HTTP server with CORS-friendly response for health checks
    this.httpServer = createServer((req, res) => {
      // CORS headers for local dev
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          pty: this.ptyManager.isRunning,
          pid: this.ptyManager.pid,
          uptime: process.uptime(),
        }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    // Terminal WebSocket server — raw PTY stream
    this.terminalWss = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false,
    });

    // RPC WebSocket server — JSON-RPC channel
    this.rpcWss = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false,
    });

    this.setupUpgradeHandler();
    this.setupTerminalHandler();
    this.setupRpcHandler();
  }

  /**
   * Routes incoming WebSocket upgrade requests to the correct server
   * based on URL path.
   */
  private setupUpgradeHandler(): void {
    this.httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
      const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;

      if (pathname === '/terminal') {
        this.terminalWss.handleUpgrade(request, socket, head, (ws) => {
          this.terminalWss.emit('connection', ws, request);
        });
      } else if (pathname === '/rpc') {
        this.rpcWss.handleUpgrade(request, socket, head, (ws) => {
          this.rpcWss.emit('connection', ws, request);
        });
      } else {
        log('ws', `Rejected connection to unknown path: ${pathname}`, 'warn');
        socket.destroy();
      }
    });
  }

  /**
   * Handles terminal WebSocket connections.
   * Pipes bidirectional data between xterm.js and the PTY.
   */
  private setupTerminalHandler(): void {
    this.terminalWss.on('connection', (ws: WebSocket) => {
      log('ws', '⚡ Terminal client connected');

      // Pipe PTY output → WebSocket
      const dataHandler = (data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      };
      this.ptyManager.on('data', dataHandler);

      // Pipe WebSocket messages → PTY input
      ws.on('message', (message: Buffer | string) => {
        try {
          const data = message.toString();

          // Check for resize messages (JSON format)
          if (data.startsWith('{"type":"resize"')) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
                this.ptyManager.resize(parsed.cols, parsed.rows);
                return;
              }
            } catch {
              // Not JSON, treat as terminal input
            }
          }

          this.ptyManager.write(data);
        } catch (error) {
          log('ws', `Error writing to PTY: ${error}`, 'error');
        }
      });

      // Cleanup on disconnect
      ws.on('close', () => {
        log('ws', 'Terminal client disconnected');
        this.ptyManager.removeListener('data', dataHandler);
      });

      ws.on('error', (error) => {
        log('ws', `Terminal WS error: ${error.message}`, 'error');
        this.ptyManager.removeListener('data', dataHandler);
      });

      // Send initial resize to sync dimensions
      ws.send('\x1b[?25h'); // Show cursor
    });
  }

  /**
   * Handles RPC WebSocket connections.
   * Parses JSON-RPC requests, dispatches to handler, sends responses.
   */
  private setupRpcHandler(): void {
    this.rpcWss.on('connection', (ws: WebSocket) => {
      log('ws', '🔌 RPC client connected');

      ws.on('message', async (message: Buffer | string) => {
        const raw = message.toString();

        // Parse the message
        const parsed = this.rpcHandler.parseMessage(raw);

        // If parsing returned an error response, send it directly
        if ('error' in parsed) {
          ws.send(JSON.stringify(parsed));
          return;
        }

        // Handle the valid request
        const response = await this.rpcHandler.handle(parsed as JsonRpcRequest);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(response));
        }
      });

      ws.on('close', () => {
        log('ws', 'RPC client disconnected');
      });

      ws.on('error', (error) => {
        log('ws', `RPC WS error: ${error.message}`, 'error');
      });
    });
  }

  /**
   * Starts the WebSocket server and begins listening.
   */
  async start(options: WsServerOptions): Promise<void> {
    const { port, host = '127.0.0.1' } = options;

    return new Promise((resolve, reject) => {
      this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          log('ws', `Port ${port} is already in use`, 'error');
        }
        reject(error);
      });

      this.httpServer.listen(port, host, () => {
        log('ws', `Server listening on ws://${host}:${port}`);
        log('ws', `  ├─ Terminal: ws://${host}:${port}/terminal`);
        log('ws', `  ├─ RPC:      ws://${host}:${port}/rpc`);
        log('ws', `  └─ Health:   http://${host}:${port}/health`);

        // Start heartbeat to detect stale connections
        this.startHeartbeat();

        resolve();
      });
    });
  }

  /**
   * Starts a heartbeat interval to detect and clean up dead connections.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const wss of [this.terminalWss, this.rpcWss]) {
        wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
          if (ws.isAlive === false) {
            ws.terminate();
            return;
          }
          ws.isAlive = false;
          ws.ping();
        });
      }
    }, 30000);
  }

  /**
   * Returns the number of connected clients.
   */
  get connections(): { terminal: number; rpc: number } {
    return {
      terminal: this.terminalWss.clients.size,
      rpc: this.rpcWss.clients.size,
    };
  }

  /**
   * Gracefully shuts down the server.
   */
  async shutdown(): Promise<void> {
    log('ws', 'Shutting down...');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all WebSocket connections
    for (const wss of [this.terminalWss, this.rpcWss]) {
      wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });
      wss.close();
    }

    // Close HTTP server
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        log('ws', 'Server shut down');
        resolve();
      });
    });
  }
}
