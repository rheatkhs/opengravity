/**
 * Core tool definitions for the autonomous agent.
 * Uses Zod schemas for validation and Vercel AI SDK tool() format.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { listDirectory as fsListDir, readFile as fsReadFile, writeFile as fsWriteFile, resolveFile, getRootHandle } from '../lib/fs-access';
import { rpcClient } from '../lib/rpc-client';

/**
 * Creates the tool definitions bound to the current file system context.
 */
export function createTools() {
  return {
    list_directory: tool({
      description: 'List the contents of a directory. Returns file/folder names with their types. Use this first to understand project structure.',
      parameters: z.object({
        path: z.string().describe('Relative path from project root. Use "." for the root directory.'),
      }),
      execute: async ({ path }: { path: string }) => {
        const root = getRootHandle();
        if (!root) return { error: 'No project directory open. Ask the user to open a folder.' };

        try {
          let targetHandle: FileSystemDirectoryHandle = root;

          if (path && path !== '.' && path !== './') {
            const parts = path.split('/').filter(Boolean);
            for (const part of parts) {
              targetHandle = await targetHandle.getDirectoryHandle(part);
            }
          }

          const entries = await fsListDir(targetHandle, path === '.' ? '' : path, 0, 2);

          const formatted = entries.map((e) =>
            e.kind === 'directory'
              ? `📁 ${e.name}/ (${e.children?.length ?? 0} items)`
              : `📄 ${e.name}`
          ).join('\n');

          return { content: formatted, count: entries.length };
        } catch (err) {
          return { error: `Failed to list directory "${path}": ${(err as Error).message}` };
        }
      }
    } as any),

    read_file: tool({
      description: 'Read the complete contents of a specific file. Use list_directory first to find the file path.',
      parameters: z.object({
        path: z.string().describe('Relative file path from project root (e.g. "src/index.ts")'),
      }),
      execute: async ({ path }: { path: string }) => {
        try {
          const handle = await resolveFile(path);
          if (!handle) return { error: `File not found: ${path}` };

          const content = await fsReadFile(handle);

          // Add line numbers for easier patching
          const numbered = content.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n');

          return { path, content: numbered, lines: content.split('\n').length };
        } catch (err) {
          return { error: `Failed to read "${path}": ${(err as Error).message}` };
        }
      }
    } as any),

    patch_file: tool({
      description: 'Edit a file by replacing specific text. Provide the exact text to find and the replacement text. This is more token-efficient than rewriting entire files.',
      parameters: z.object({
        path: z.string().describe('Relative file path from project root'),
        search: z.string().describe('The exact text to search for in the file. Must match exactly.'),
        replace: z.string().describe('The text to replace the search text with.'),
      }),
      execute: async ({ path, search, replace }: { path: string; search: string; replace: string }) => {
        try {
          const handle = await resolveFile(path);
          if (!handle) return { error: `File not found: ${path}` };

          const content = await fsReadFile(handle);

          if (!content.includes(search)) {
            return { error: `Search text not found in ${path}. Make sure it matches exactly (including whitespace).` };
          }

          const newContent = content.replace(search, replace);
          await fsWriteFile(handle, newContent);

          return { success: true, path, message: `Patched ${path} successfully` };
        } catch (err) {
          return { error: `Failed to patch "${path}": ${(err as Error).message}` };
        }
      }
    } as any),

    execute_command: tool({
      description: 'Execute a shell command in the local terminal. Returns the command output and exit code. Use for running builds, tests, git commands, etc.',
      parameters: z.object({
        command: z.string().describe('The shell command to execute (e.g. "npm run build", "git status")'),
      }),
      execute: async ({ command }: { command: string }) => {
        try {
          if (!rpcClient.isConnected) {
            await rpcClient.connect();
          }

          const result = await rpcClient.executeCommand(command);

          return {
            output: result.output,
            exitCode: result.exitCode,
            success: result.exitCode === 0,
          };
        } catch (err) {
          return { error: `Command execution failed: ${(err as Error).message}` };
        }
      }
    } as any),
  };
}
