/**
 * JSON-RPC 2.0 client over WebSocket for agent command execution.
 */

import type { JsonRpcRequest, JsonRpcResponse, ExecuteCommandResult } from '../types/rpc';

export class RpcClient {
  private ws: WebSocket | null = null;
  private url: string;
  private pendingRequests: Map<string | number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private idCounter = 0;
  private _isConnected = false;

  constructor(url: string = 'ws://127.0.0.1:9800/rpc') {
    this.url = url;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Connects to the RPC WebSocket endpoint.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this._isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const response: JsonRpcResponse = JSON.parse(event.data);
            const pending = this.pendingRequests.get(response.id);
            if (pending) {
              clearTimeout(pending.timeout);
              this.pendingRequests.delete(response.id);

              if (response.error) {
                pending.reject(new Error(response.error.message));
              } else {
                pending.resolve(response.result);
              }
            }
          } catch {
            // Ignore non-JSON messages
          }
        };

        this.ws.onclose = () => {
          this._isConnected = false;
          // Reject all pending requests
          for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Connection closed'));
            this.pendingRequests.delete(id);
          }
        };

        this.ws.onerror = () => {
          reject(new Error('RPC WebSocket connection failed'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sends a JSON-RPC call and returns the result.
   */
  async call<T = unknown>(method: string, params?: Record<string, unknown>, timeoutMs: number = 60000): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    const id = ++this.idCounter;

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`RPC call '${method}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      this.ws!.send(JSON.stringify(request));
    });
  }

  /**
   * Executes a shell command via the daemon.
   */
  async executeCommand(command: string, timeout?: number): Promise<ExecuteCommandResult> {
    return this.call<ExecuteCommandResult>('execute_command', { command, timeout });
  }

  /**
   * Pings the daemon for health check.
   */
  async ping(): Promise<{ pong: boolean; timestamp: number }> {
    return this.call('ping');
  }

  /**
   * Disconnects the RPC client.
   */
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this._isConnected = false;
  }
}

// Singleton instance
export const rpcClient = new RpcClient();
