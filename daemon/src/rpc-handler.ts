import { PtyManager } from './pty-manager.js';
import { log } from './utils.js';

/**
 * JSON-RPC 2.0 Request shape.
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: string | number;
}

/**
 * JSON-RPC 2.0 Response shape.
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// JSON-RPC error codes
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INTERNAL_ERROR = -32603;

/**
 * RpcHandler processes JSON-RPC 2.0 requests and dispatches
 * them to the appropriate PTY manager methods.
 */
export class RpcHandler {
  private ptyManager: PtyManager;

  constructor(ptyManager: PtyManager) {
    this.ptyManager = ptyManager;
  }

  /**
   * Parses raw string message into a JSON-RPC request.
   */
  parseMessage(raw: string): JsonRpcRequest | JsonRpcResponse {
    try {
      const parsed = JSON.parse(raw);

      if (!parsed.jsonrpc || parsed.jsonrpc !== '2.0') {
        return this.createError(parsed.id || null, INVALID_REQUEST, 'Invalid JSON-RPC version');
      }

      if (!parsed.method || typeof parsed.method !== 'string') {
        return this.createError(parsed.id || null, INVALID_REQUEST, 'Missing or invalid method');
      }

      if (parsed.id === undefined || parsed.id === null) {
        return this.createError(null, INVALID_REQUEST, 'Missing request ID');
      }

      return parsed as JsonRpcRequest;
    } catch {
      return this.createError(null, PARSE_ERROR, 'Failed to parse JSON');
    }
  }

  /**
   * Handles a JSON-RPC request and returns a response.
   */
  async handle(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { method, params, id } = request;

    log('rpc', `→ ${method}(${params ? JSON.stringify(params).slice(0, 100) : ''})`);

    try {
      switch (method) {
        case 'ping':
          return this.createResult(id, {
            pong: true,
            timestamp: Date.now(),
            pid: this.ptyManager.pid,
            running: this.ptyManager.isRunning,
          });

        case 'execute_command':
          return await this.handleExecuteCommand(id, params);

        case 'resize':
          return this.handleResize(id, params);

        case 'get_status':
          return this.createResult(id, {
            running: this.ptyManager.isRunning,
            pid: this.ptyManager.pid,
            platform: process.platform,
            uptime: process.uptime(),
          });

        default:
          return this.createError(id, METHOD_NOT_FOUND, `Unknown method: ${method}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log('rpc', `Error handling ${method}: ${message}`, 'error');
      return this.createError(id, INTERNAL_ERROR, message);
    }
  }

  /**
   * Handles the execute_command RPC method.
   * Runs a shell command in the PTY and returns output + exit code.
   */
  private async handleExecuteCommand(
    id: string | number,
    params?: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    if (!params?.command || typeof params.command !== 'string') {
      return this.createError(id, INVALID_REQUEST, 'Missing required param: command (string)');
    }

    const command = params.command as string;
    const timeout = typeof params.timeout === 'number' ? params.timeout : 30000;

    log('rpc', `Executing: ${command.slice(0, 80)}${command.length > 80 ? '...' : ''}`);

    const result = await this.ptyManager.executeCommand(command, timeout);

    return this.createResult(id, {
      output: result.output,
      exitCode: result.exitCode,
      id: result.id,
    });
  }

  /**
   * Handles the resize RPC method.
   */
  private handleResize(
    id: string | number,
    params?: Record<string, unknown>
  ): JsonRpcResponse {
    if (!params?.cols || !params?.rows) {
      return this.createError(id, INVALID_REQUEST, 'Missing required params: cols (number), rows (number)');
    }

    const cols = Number(params.cols);
    const rows = Number(params.rows);

    if (isNaN(cols) || isNaN(rows) || cols < 1 || rows < 1) {
      return this.createError(id, INVALID_REQUEST, 'Invalid dimensions: cols and rows must be positive integers');
    }

    this.ptyManager.resize(cols, rows);

    return this.createResult(id, { cols, rows });
  }

  /**
   * Creates a successful JSON-RPC response.
   */
  private createResult(id: string | number | null, result: unknown): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      result,
    };
  }

  /**
   * Creates a JSON-RPC error response.
   */
  private createError(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      error: { code, message, ...(data !== undefined && { data }) },
    };
  }
}
