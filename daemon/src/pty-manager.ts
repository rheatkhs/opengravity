import * as pty from 'node-pty';
import { EventEmitter } from 'node:events';
import { getDefaultShell, getShellArgs, getHomePath, getSafeEnv, log, generateId } from './utils.js';

export interface PtyOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
}

export interface CommandResult {
  id: string;
  output: string;
  exitCode: number | null;
}

interface PendingCommand {
  id: string;
  command: string;
  output: string;
  resolve: (result: CommandResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  marker: string;
}

/**
 * PtyManager encapsulates the node-pty process lifecycle.
 * Supports both interactive terminal streaming and discrete command execution.
 */
export class PtyManager extends EventEmitter {
  private process: pty.IPty | null = null;
  private shell: string;
  private pendingCommand: PendingCommand | null = null;
  public cwd: string = process.cwd();

  constructor() {
    super();
    this.shell = getDefaultShell();
    // Normalize workspace cwd when running from daemon directory
    if (this.cwd.endsWith('daemon') || this.cwd.endsWith('daemon/')) {
      this.cwd = this.cwd.replace(/[/\\]daemon[/\\]?$/, '');
    }
  }

  /**
   * Spawns a new PTY process with the detected shell.
   */
  spawn(options: PtyOptions = {}): void {
    const { cols = 120, rows = 30, cwd } = options;

    if (cwd) {
      this.cwd = cwd;
    }

    if (this.process) {
      this.destroy();
    }

    const shellArgs = getShellArgs(this.shell);
    const spawnedProcess = pty.spawn(this.shell, shellArgs, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: this.cwd,
      env: getSafeEnv(),
    });

    this.process = spawnedProcess;
    log('pty', `Spawned ${this.shell} (PID: ${this.process.pid}, ${cols}x${rows})`);

    spawnedProcess.onData((data: string) => {
      // Check if we're capturing output for a discrete command
      if (this.pendingCommand) {
        this.handleCommandOutput(data);
      }

      // Always emit data for the interactive terminal stream
      this.emit('data', data);
    });

    spawnedProcess.onExit(({ exitCode, signal }) => {
      log('pty', `Process exited (code: ${exitCode}, signal: ${signal})`, 'warn');
      if (this.process === spawnedProcess) {
        this.emit('exit', { exitCode, signal });
        this.process = null;
      }
    });
  }

  /**
   * Writes raw data to the PTY (interactive keystrokes).
   */
  write(data: string): void {
    if (!this.process) {
      throw new Error('PTY process not running');
    }
    this.process.write(data);
  }

  /**
   * Resizes the PTY dimensions.
   */
  resize(cols: number, rows: number): void {
    if (!this.process) {
      throw new Error('PTY process not running');
    }
    this.process.resize(cols, rows);
    log('pty', `Resized to ${cols}x${rows}`);
  }

  /**
   * Executes a discrete shell command and captures its output.
   * Uses a unique end-marker to detect command completion.
   * Returns output and exit code.
   */
  async executeCommand(command: string, timeoutMs: number = 30000): Promise<CommandResult> {
    if (!this.process) {
      throw new Error('PTY process not running');
    }

    if (this.pendingCommand) {
      throw new Error('Another command is already executing');
    }

    const id = generateId();
    const marker = `__OG_END_${id}__`;

    return new Promise<CommandResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingCommand?.id === id) {
          const result: CommandResult = {
            id,
            output: this.pendingCommand.output,
            exitCode: null,
          };
          this.pendingCommand = null;
          resolve(result);
          log('pty', `Command timed out after ${timeoutMs}ms: ${command}`, 'warn');
        }
      }, timeoutMs);

      this.pendingCommand = {
        id,
        command,
        output: '',
        resolve,
        reject,
        timeout,
        marker,
      };

      // Write the command followed by an echo of the marker and exit code
      // This works cross-platform: bash/zsh and powershell
      const isWindows = process.platform === 'win32';
      let wrappedCommand: string;

      if (isWindows) {
        // PowerShell: execute command, then echo marker with exit code
        wrappedCommand = `${command}; Write-Host "${marker}:$LASTEXITCODE"\r`;
      } else {
        // Bash/Zsh: execute command, then echo marker with exit code
        wrappedCommand = `${command}; echo "${marker}:$?"\r`;
      }

      this.process!.write(wrappedCommand);
    });
  }

  /**
   * Handles incoming PTY data during discrete command execution.
   * Scans for the completion marker to resolve the pending command.
   */
  private handleCommandOutput(data: string): void {
    if (!this.pendingCommand) return;

    this.pendingCommand.output += data;

    const markerIndex = this.pendingCommand.output.indexOf(this.pendingCommand.marker);
    if (markerIndex !== -1) {
      const fullOutput = this.pendingCommand.output;
      const afterMarker = fullOutput.substring(markerIndex + this.pendingCommand.marker.length);

      // Extract exit code from ":exitCode" after the marker
      const exitCodeMatch = afterMarker.match(/:(\d+)/);
      const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 0;

      // Clean output: everything before the marker, minus the echoed command itself
      let cleanOutput = fullOutput.substring(0, markerIndex).trim();

      // Remove the first line if it's the echoed command
      const lines = cleanOutput.split('\n');
      if (lines.length > 0 && lines[0].includes(this.pendingCommand.command.trim())) {
        lines.shift();
        cleanOutput = lines.join('\n').trim();
      }

      const result: CommandResult = {
        id: this.pendingCommand.id,
        output: cleanOutput,
        exitCode,
      };

      clearTimeout(this.pendingCommand.timeout);
      const resolve = this.pendingCommand.resolve;
      this.pendingCommand = null;
      resolve(result);

      log('pty', `Command completed (exit: ${exitCode}): ${result.output.length} chars output`);
    }
  }

  /**
   * Returns the PID of the running PTY process.
   */
  get pid(): number | undefined {
    return this.process?.pid;
  }

  /**
   * Returns whether the PTY process is currently running.
   */
  get isRunning(): boolean {
    return this.process !== null;
  }

  /**
   * Gracefully destroys the PTY process.
   */
  destroy(): void {
    if (this.process) {
      log('pty', `Killing process (PID: ${this.process.pid})`);
      this.process.kill();
      this.process = null;
    }

    if (this.pendingCommand) {
      clearTimeout(this.pendingCommand.timeout);
      this.pendingCommand.reject(new Error('PTY destroyed'));
      this.pendingCommand = null;
    }
  }
}
