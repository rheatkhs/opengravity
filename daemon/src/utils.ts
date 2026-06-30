import * as os from 'node:os';

/**
 * Detects the default shell for the current platform.
 * Windows → powershell.exe, Unix → $SHELL or /bin/bash fallback.
 */
export function getDefaultShell(): string {
  if (os.platform() === 'win32') {
    return process.env.COMSPEC || 'powershell.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

/**
 * Returns shell arguments for a clean interactive session.
 */
export function getShellArgs(shell: string): string[] {
  if (os.platform() === 'win32') {
    if (shell.includes('powershell') || shell.includes('pwsh')) {
      return ['-NoLogo'];
    }
    return [];
  }
  // Unix: login shell
  return ['-l'];
}

/**
 * Returns the user's home directory path.
 */
export function getHomePath(): string {
  return os.homedir();
}

/**
 * Generates a simple unique ID for JSON-RPC correlation.
 */
let counter = 0;
export function generateId(): string {
  return `og_${Date.now()}_${++counter}`;
}

/**
 * Sanitizes environment variables for PTY spawning.
 * Removes problematic variables that can interfere with PTY behavior.
 */
export function getSafeEnv(): Record<string, string> {
  const env = { ...process.env } as Record<string, string>;
  // Ensure TERM is set for proper terminal behavior
  env['TERM'] = 'xterm-256color';
  // Remove PAGER to avoid blocking in PTY
  delete env['PAGER'];
  return env;
}

/**
 * Formats a log message with timestamp and component tag.
 */
export function log(component: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `\x1b[90m${timestamp}\x1b[0m`;
  const tag = level === 'error'
    ? `\x1b[31m[${component}]\x1b[0m`
    : level === 'warn'
      ? `\x1b[33m[${component}]\x1b[0m`
      : `\x1b[36m[${component}]\x1b[0m`;
  console.log(`${prefix} ${tag} ${message}`);
}
