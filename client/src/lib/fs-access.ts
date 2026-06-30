/**
 * File System Access API wrapper for local directory binding.
 * Uses the modern File System Access API (window.showDirectoryPicker).
 */

export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  children?: FileNode[];
  extension?: string;
}

let rootHandle: FileSystemDirectoryHandle | null = null;

/**
 * Opens a native directory picker dialog and returns the handle.
 */
export async function openDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    rootHandle = handle;
    return handle;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
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
  const file = await fileHandle.getFile();
  return file.text();
}

/**
 * Writes content to a file using its FileSystemFileHandle.
 */
export async function writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Resolves a relative path to a FileSystemFileHandle from the root.
 */
export async function resolveFile(path: string): Promise<FileSystemFileHandle | null> {
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
