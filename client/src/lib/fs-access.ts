/**
 * File System Access API wrapper for local directory binding.
 * Uses the modern File System Access API (window.showDirectoryPicker).
 */

import { rpcClient } from './rpc-client';

export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  children?: FileNode[];
  extension?: string;
}

let rootHandle: FileSystemDirectoryHandle | null = null;
let useDaemonFS = false;

/** The absolute path of the last opened workspace (for session persistence) */
export let lastOpenedPath = '';

/**
 * Opens a native directory picker dialog and returns the handle.
 */
export async function openDirectory(): Promise<FileSystemDirectoryHandle | null> {
  // Try native showDirectoryPicker first, if supported
  if (typeof (window as any).showDirectoryPicker === 'function') {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      rootHandle = handle;
      useDaemonFS = false;
      return handle;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return null; // User cancelled
      }
      console.warn('Native showDirectoryPicker failed, falling back to PTY Daemon filesystem:', err);
    }
  }

  // Fallback: use Daemon-backed filesystem via JSON-RPC
  // This will launch a native folder picker dialog on the server side
  try {
    const res = await rpcClient.call<{ path: string; name: string }>('fs_open_directory', {});
    useDaemonFS = true;
    
    const mockHandle = createMockDirectoryHandle(res.name, '');
    rootHandle = mockHandle as any;
    lastOpenedPath = res.path;
    return rootHandle;
  } catch (err) {
    const msg = (err as Error).message || '';
    // User cancelled the folder selection — not an error
    if (msg.includes('cancelled') || msg.includes('canceled')) {
      return null;
    }
    console.error('Daemon filesystem open failed:', err);
    throw err;
  }
}

/**
 * Restores a previously opened workspace directory by path (no dialog shown).
 * Used to restore sessions from localStorage on page refresh.
 */
export async function restoreDirectory(savedPath: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const res = await rpcClient.call<{ path: string; name: string }>('fs_open_directory', { path: savedPath });
    useDaemonFS = true;

    const mockHandle = createMockDirectoryHandle(res.name, '');
    rootHandle = mockHandle as any;
    lastOpenedPath = res.path;
    return rootHandle;
  } catch (err) {
    console.warn('Failed to restore workspace directory:', err);
    return null;
  }
}

/**
 * Gets the currently opened root directory handle.
 */
export function getRootHandle(): FileSystemDirectoryHandle | null {
  return rootHandle;
}

/**
 * Recursively reads a directory tree from a handle.
 */
export async function listDirectory(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string = '',
  depth: number = 0,
  maxDepth: number = 5
): Promise<FileNode[]> {
  if (useDaemonFS) {
    try {
      const relativePath = (dirHandle as any).path || '';
      const res = await rpcClient.call<any[]>('fs_list_directory', { path: relativePath });
      return mapRpcEntriesToNodes(res);
    } catch (err) {
      console.error('Failed to list directory from daemon RPC:', err);
      return [];
    }
  }

  const entries: FileNode[] = [];

  if (depth > maxDepth) return entries;

  for await (const [name, handle] of dirHandle.entries()) {
    // Skip hidden files and common noise
    if (name.startsWith('.') || name === 'node_modules' || name === '__pycache__') {
      continue;
    }

    const path = parentPath ? `${parentPath}/${name}` : name;

    if (handle.kind === 'directory') {
      const children = await listDirectory(
        handle as FileSystemDirectoryHandle,
        path,
        depth + 1,
        maxDepth
      );
      entries.push({
        name,
        path,
        kind: 'directory',
        handle,
        children,
      });
    } else {
      const ext = name.includes('.') ? name.split('.').pop() || '' : '';
      entries.push({
        name,
        path,
        kind: 'file',
        handle,
        extension: ext,
      });
    }
  }

  // Sort: directories first, then files, alphabetical within each
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return entries;
}

/**
 * Reads file content from a FileSystemFileHandle.
 */
export async function readFile(fileHandle: FileSystemFileHandle): Promise<string> {
  if (useDaemonFS) {
    const relativePath = (fileHandle as any).path;
    const res = await rpcClient.call<{ content: string }>('fs_read_file', { path: relativePath });
    return res.content;
  }
  const file = await fileHandle.getFile();
  return file.text();
}

/**
 * Writes content to a file using its FileSystemFileHandle.
 */
export async function writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
  if (useDaemonFS) {
    const relativePath = (fileHandle as any).path;
    await rpcClient.call('fs_write_file', { path: relativePath, content });
    return;
  }
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Resolves a relative path to a FileSystemFileHandle from the root.
 */
export async function resolveFile(path: string): Promise<FileSystemFileHandle | null> {
  if (useDaemonFS) {
    return createMockFileHandle(path.split('/').pop() || '', path) as any;
  }
  if (!rootHandle) return null;

  const parts = path.split('/').filter(Boolean);
  let current: FileSystemDirectoryHandle = rootHandle;

  for (let i = 0; i < parts.length - 1; i++) {
    try {
      current = await current.getDirectoryHandle(parts[i]);
    } catch {
      return null;
    }
  }

  try {
    return await current.getFileHandle(parts[parts.length - 1]);
  } catch {
    return null;
  }
}

/**
 * Gets the file extension icon mapping.
 */
export function getFileIcon(extension: string): string {
  const iconMap: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟡', jsx: '⚛️',
    json: '📋', md: '📝', css: '🎨', html: '🌐',
    py: '🐍', rs: '🦀', go: '🐹', java: '☕',
    svg: '🖼️', png: '🖼️', jpg: '🖼️',
    yml: '⚙️', yaml: '⚙️', toml: '⚙️',
    sh: '📜', bash: '📜', zsh: '📜',
    lock: '🔒', gitignore: '🚫',
  };
  return iconMap[extension] || '📄';
}

function createMockDirectoryHandle(name: string, path: string) {
  return {
    kind: 'directory' as const,
    name,
    path,
  };
}

function createMockFileHandle(name: string, path: string) {
  return {
    kind: 'file' as const,
    name,
    path,
  };
}

function mapRpcEntriesToNodes(entries: any[]): FileNode[] {
  return entries.map((entry) => {
    if (entry.kind === 'directory') {
      const mockHandle = createMockDirectoryHandle(entry.name, entry.path);
      return {
        name: entry.name,
        path: entry.path,
        kind: 'directory',
        handle: mockHandle as any,
        children: entry.children ? mapRpcEntriesToNodes(entry.children) : [],
      };
    } else {
      const mockHandle = createMockFileHandle(entry.name, entry.path);
      return {
        name: entry.name,
        path: entry.path,
        kind: 'file',
        handle: mockHandle as any,
        extension: entry.extension,
      };
    }
  });
}
