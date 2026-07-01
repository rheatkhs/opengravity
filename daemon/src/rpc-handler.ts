import { PtyManager } from './pty-manager.js';
import { log } from './utils.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

let activeWorkspaceRoot = process.cwd();
if (path.basename(activeWorkspaceRoot) === 'daemon') {
  activeWorkspaceRoot = path.dirname(activeWorkspaceRoot);
}

async function getFileTree(
  dirPath: string,
  parentRelativePath: string = '',
  depth: number = 0,
  maxDepth: number = 5
): Promise<any[]> {
  const entries: any[] = [];
  if (depth > maxDepth) return entries;
  
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      if (file.name.startsWith('.') || file.name === 'node_modules' || file.name === '__pycache__') {
        continue;
      }
      
      const relativePath = parentRelativePath ? `${parentRelativePath}/${file.name}` : file.name;
      const absolutePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        const children = await getFileTree(absolutePath, relativePath, depth + 1, maxDepth);
        entries.push({
          name: file.name,
          path: relativePath,
          kind: 'directory',
          children,
        });
      } else {
        const ext = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
        entries.push({
          name: file.name,
          path: relativePath,
          kind: 'file',
          extension: ext,
        });
      }
    }
  } catch (err) {
    log('rpc', `Error reading dir ${dirPath}: ${(err as Error).message}`, 'error');
  }
  
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  
  return entries;
}

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

        case 'fs_open_directory':
          return await this.handleFsOpenDirectory(id, params);

        case 'fs_list_directory':
          return await this.handleFsListDirectory(id, params);

        case 'fs_read_file':
          return await this.handleFsReadFile(id, params);

        case 'fs_write_file':
          return await this.handleFsWriteFile(id, params);

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

  private async handleFsOpenDirectory(
    id: string | number,
    params?: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    // If an explicit path is provided, use it directly (no dialog)
    if (params?.path && typeof params.path === 'string') {
      activeWorkspaceRoot = path.resolve(params.path);
      log('rpc', `Opened workspace directory (explicit): ${activeWorkspaceRoot}`);
      try {
        this.ptyManager.spawn({ cwd: activeWorkspaceRoot });
      } catch (err) {
        log('rpc', `Failed to spawn terminal in ${activeWorkspaceRoot}: ${(err as Error).message}`, 'error');
      }
      return this.createResult(id, {
        path: activeWorkspaceRoot,
        name: path.basename(activeWorkspaceRoot),
      });
    }

    // Launch native folder picker dialog via PowerShell
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const scriptPath = path.resolve(__dirname, '..', 'select_folder.ps1');

      // Use inline PowerShell if the script file doesn't exist
      let command: string;
      try {
        await fs.access(scriptPath);
        command = `powershell -sta -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
      } catch {
        // Inline fallback — show a folder browser dialog
        command = `powershell -sta -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.Form; $f.TopMost = $true; $f.ShowInTaskbar = $false; $f.WindowState = 'Minimized'; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select Project Folder'; $d.RootFolder = 'MyComputer'; $d.ShowNewFolderButton = $false; if ($d.ShowDialog($f) -eq 'OK') { Write-Output $d.SelectedPath } else { Write-Output 'CANCEL' }; $f.Dispose()"`;
      }

      log('rpc', `Launching folder picker dialog...`);

      // Use async exec wrapped in a Promise so we don't block the event loop
      const result = await new Promise<string>((resolve, reject) => {
        exec(command, {
          encoding: 'utf8',
          timeout: 120000, // 2 minutes to select
          windowsHide: false,
        }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout.trim());
          }
        });
      });

      if (!result || result === 'CANCEL') {
        return this.createError(id, -32000, 'User cancelled folder selection');
      }

      // Validate the selected path exists
      try {
        const stat = await fs.stat(result);
        if (!stat.isDirectory()) {
          return this.createError(id, -32000, 'Selected path is not a directory');
        }
      } catch {
        return this.createError(id, -32000, `Selected path does not exist: ${result}`);
      }

      activeWorkspaceRoot = result;
      log('rpc', `Opened workspace directory: ${activeWorkspaceRoot}`);
      try {
        this.ptyManager.spawn({ cwd: activeWorkspaceRoot });
      } catch (err) {
        log('rpc', `Failed to spawn terminal in ${activeWorkspaceRoot}: ${(err as Error).message}`, 'error');
      }
      return this.createResult(id, {
        path: activeWorkspaceRoot,
        name: path.basename(activeWorkspaceRoot),
      });
    } catch (err) {
      const msg = (err as Error).message;
      log('rpc', `Folder picker failed: ${msg}`, 'error');
      return this.createError(id, INTERNAL_ERROR, `Folder picker failed: ${msg}`);
    }
  }

  private async handleFsListDirectory(
    id: string | number,
    params?: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    const relativePath = typeof params?.path === 'string' ? params.path : '';
    const targetDir = path.join(activeWorkspaceRoot, relativePath);
    
    const normalizedRoot = path.normalize(activeWorkspaceRoot).toLowerCase();
    const normalizedTarget = path.normalize(targetDir).toLowerCase();
    if (!normalizedTarget.startsWith(normalizedRoot)) {
      return this.createError(id, INVALID_REQUEST, 'Path traversal detected');
    }

    const tree = await getFileTree(targetDir, relativePath, 0, 5);
    return this.createResult(id, tree);
  }

  private async handleFsReadFile(
    id: string | number,
    params?: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    if (!params?.path || typeof params.path !== 'string') {
      return this.createError(id, INVALID_REQUEST, 'Missing required param: path (string)');
    }

    const targetFile = path.join(activeWorkspaceRoot, params.path);
    const normalizedRoot = path.normalize(activeWorkspaceRoot).toLowerCase();
    const normalizedTarget = path.normalize(targetFile).toLowerCase();
    if (!normalizedTarget.startsWith(normalizedRoot)) {
      return this.createError(id, INVALID_REQUEST, 'Path traversal detected');
    }

    try {
      const content = await fs.readFile(targetFile, 'utf8');
      return this.createResult(id, { content });
    } catch (err) {
      return this.createError(id, INTERNAL_ERROR, `Failed to read file: ${(err as Error).message}`);
    }
  }

  private async handleFsWriteFile(
    id: string | number,
    params?: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    if (!params?.path || typeof params.path !== 'string') {
      return this.createError(id, INVALID_REQUEST, 'Missing required param: path (string)');
    }
    if (typeof params.content !== 'string') {
      return this.createError(id, INVALID_REQUEST, 'Missing required param: content (string)');
    }

    const targetFile = path.join(activeWorkspaceRoot, params.path);
    const normalizedRoot = path.normalize(activeWorkspaceRoot).toLowerCase();
    const normalizedTarget = path.normalize(targetFile).toLowerCase();
    if (!normalizedTarget.startsWith(normalizedRoot)) {
      return this.createError(id, INVALID_REQUEST, 'Path traversal detected');
    }

    try {
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await fs.writeFile(targetFile, params.content, 'utf8');
      return this.createResult(id, { success: true });
    } catch (err) {
      return this.createError(id, INTERNAL_ERROR, `Failed to write file: ${(err as Error).message}`);
    }
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
