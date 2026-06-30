/** JSON-RPC 2.0 types for daemon communication */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface ExecuteCommandResult {
  output: string;
  exitCode: number | null;
  id: string;
}

export interface DaemonHealth {
  status: string;
  pty: boolean;
  pid: number;
  uptime: number;
}
