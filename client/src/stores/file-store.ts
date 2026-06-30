import { create } from 'zustand';
import type { FileNode } from '../lib/fs-access';

interface FileStore {
  rootHandle: FileSystemDirectoryHandle | null;
  rootName: string;
  tree: FileNode[];
  isLoading: boolean;

  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  setRootName: (name: string) => void;
  setTree: (tree: FileNode[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  rootHandle: null,
  rootName: '',
  tree: [],
  isLoading: false,

  setRootHandle: (handle) => set({ rootHandle: handle }),
  setRootName: (name) => set({ rootName: name }),
  setTree: (tree) => set({ tree }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ rootHandle: null, rootName: '', tree: [], isLoading: false }),
}));
