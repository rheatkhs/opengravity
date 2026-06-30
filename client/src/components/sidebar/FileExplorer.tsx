import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, RefreshCw, MoreHorizontal } from 'lucide-react';
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
        className="flex items-center gap-1.5 w-full py-[4px] text-left text-xs hover:bg-[var(--color-bg-hover)] rounded-sm cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px`, color: 'var(--color-text-secondary)' }}>
        {node.kind === 'directory' ? (
          <span className="flex items-center gap-1 shrink-0">
            {isOpen ? <ChevronDown size={11} className="opacity-60" /> : <ChevronRight size={11} className="opacity-60" />}
            <span className="text-[12px] opacity-80">📁</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 shrink-0">
            <span className="w-3" />
            <span className="text-[11px] opacity-90">{getFileIcon(node.extension || '')}</span>
          </span>
        )}
        <span className="truncate font-sans text-[11.5px]">{node.name}</span>
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
    <div className="h-full flex flex-col select-none text-[11px]" style={{
      paddingLeft: '12px',
      paddingRight: '12px'
    }}>
      <div className="flex items-center justify-between h-9 px-4 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Explorer</span>
        <div className="flex items-center gap-1">
          {rootName && (
            <button onClick={handleRefresh} className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer" title="Refresh">
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer" title="More Actions">
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-start p-4">
        {!rootName ? (
          <div className="flex flex-col gap-3 py-4 select-none">
            <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
              You have not yet opened a workspace folder.
            </p>
            <button onClick={handleOpenFolder}
              className="w-full text-xs text-white bg-[#007acc] hover:bg-[#1f8ad2] rounded-[3px] transition-colors text-center cursor-pointer font-semibold shadow-sm" style={{
                paddingTop: '8px',
                paddingBottom: '8px'
              }}>
              Open Folder
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto w-full">
            <div className="py-1.5 px-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider truncate mb-1 border-b border-[var(--color-border-subtle)]/30">
              {rootName}
            </div>
            {tree.map((n) => <FileTreeNode key={n.path} node={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
