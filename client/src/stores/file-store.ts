import { create } from 'zustand';
import type { FileNode } from '../lib/fs-access';

const STORAGE_KEY = 'og_workspace';

interface WorkspaceSession {
  path: string;
  name: string;
}

interface FileStore {
  rootHandle: FileSystemDirectoryHandle | null;
  rootName: string;
  rootPath: string;
  tree: FileNode[];
  isLoading: boolean;

  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  setRootName: (name: string) => void;
  setRootPath: (path: string) => void;
  setTree: (tree: FileNode[]) => void;
  setLoading: (loading: boolean) => void;
  saveSession: () => void;
  getSavedSession: () => WorkspaceSession | null;
  clearSession: () => void;
  reset: () => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  rootHandle: null,
  rootName: '',
  rootPath: '',
  tree: [],
  isLoading: false,

  setRootHandle: (handle) => set({ rootHandle: handle }),
  setRootName: (name) => set({ rootName: name }),
  setRootPath: (path) => set({ rootPath: path }),
  setTree: (tree) => set({ tree }),
  setLoading: (loading) => set({ isLoading: loading }),

  saveSession: () => {
    const { rootName, rootPath } = get();
    if (rootPath && rootName) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ path: rootPath, name: rootName }));
      } catch { /* localStorage quota exceeded or unavailable */ }
    }
  },

  getSavedSession: (): WorkspaceSession | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.path && parsed?.name) return parsed as WorkspaceSession;
    } catch { /* corrupted data */ }
    return null;
  },

  clearSession: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    set({ rootHandle: null, rootName: '', rootPath: '', tree: [], isLoading: false });
  },

  reset: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    set({ rootHandle: null, rootName: '', rootPath: '', tree: [], isLoading: false });
  },
}));
