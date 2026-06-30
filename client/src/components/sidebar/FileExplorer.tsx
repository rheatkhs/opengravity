import { useState, useCallback } from 'react';
import { FolderOpen, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { useFileStore } from '../../stores/file-store';
import { useEditorStore } from '../../stores/editor-store';
import { openDirectory, listDirectory, readFile, getFileIcon, type FileNode } from '../../lib/fs-access';

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const openTab = useEditorStore((s) => s.openTab);

  const handleClick = async () => {
    if (node.kind === 'directory') { setIsOpen(!isOpen); return; }
    try {
      const handle = node.handle as FileSystemFileHandle;
      const content = await readFile(handle);
      openTab({ id: node.path, name: node.name, path: node.path, content, handle, language: '' });
    } catch (e) { console.error('Failed to open file:', e); }
  };

  return (
    <div>
      <button onClick={handleClick}
        className="flex items-center gap-1 w-full px-2 py-[3px] text-left text-xs hover:bg-[var(--color-bg-hover)] rounded-sm"
        style={{ paddingLeft: `${depth * 14 + 8}px`, color: 'var(--color-text-secondary)' }}>
        {node.kind === 'directory' ? (
          <>{isOpen ? <ChevronDown size={12} className="shrink-0 opacity-50" /> : <ChevronRight size={12} className="shrink-0 opacity-50" />}<span className="shrink-0">📁</span></>
        ) : (<><span className="w-3 shrink-0" /><span className="shrink-0 text-[10px]">{getFileIcon(node.extension || '')}</span></>)}
        <span className="truncate font-mono">{node.name}</span>
      </button>
      {node.kind === 'directory' && isOpen && node.children?.map((c) => <FileTreeNode key={c.path} node={c} depth={depth + 1} />)}
    </div>
  );
}

export default function FileExplorer() {
  const { tree, rootName, isLoading, setRootHandle, setRootName, setTree, setLoading } = useFileStore();

  const handleOpenFolder = useCallback(async () => {
    setLoading(true);
    try {
      const handle = await openDirectory();
      if (!handle) { setLoading(false); return; }
      setRootHandle(handle); setRootName(handle.name);
      setTree(await listDirectory(handle));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [setRootHandle, setRootName, setTree, setLoading]);

  const handleRefresh = useCallback(async () => {
    const rh = useFileStore.getState().rootHandle;
    if (!rh) return;
    setLoading(true);
    try { setTree(await listDirectory(rh)); } finally { setLoading(false); }
  }, [setTree, setLoading]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Explorer</span>
        <div className="flex items-center gap-1">
          {rootName && <button onClick={handleRefresh} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Refresh"><RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /></button>}
          <button onClick={handleOpenFolder} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Open Folder"><FolderOpen size={12} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {!rootName ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <FolderOpen size={28} style={{ color: 'var(--color-text-dimmed)' }} />
            <button onClick={handleOpenFolder} className="text-xs px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>Open Folder</button>
            <p className="text-[10px] text-center" style={{ color: 'var(--color-text-dimmed)' }}>Select a project folder</p>
          </div>
        ) : (
          <>
            <div className="px-3 py-1.5 text-[11px] font-semibold truncate" style={{ color: 'var(--color-text-muted)' }}>{rootName.toUpperCase()}</div>
            {tree.map((n) => <FileTreeNode key={n.path} node={n} />)}
          </>
        )}
      </div>
    </div>
  );
}
