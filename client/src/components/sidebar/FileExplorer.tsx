import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown, RefreshCw, MoreHorizontal } from 'lucide-react';
import { useFileStore } from '../../stores/file-store';
import { useEditorStore } from '../../stores/editor-store';
import { openDirectory, restoreDirectory, listDirectory, readFile, lastOpenedPath, type FileNode } from '../../lib/fs-access';
import FileIcon from './FileIcon';

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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          paddingTop: '2px',
          paddingBottom: '2px',
          paddingLeft: `${depth * 16 + 4}px`,
          paddingRight: '8px',
          textAlign: 'left',
          fontSize: '13px',
          lineHeight: '22px',
          color: 'var(--color-text-secondary)',
          borderRadius: '3px',
          cursor: 'pointer',
          transition: 'background-color 0.1s',
          border: 'none',
          background: 'none',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {node.kind === 'directory' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {isOpen
              ? <ChevronDown size={10} style={{ opacity: 0.55 }} />
              : <ChevronRight size={10} style={{ opacity: 0.55 }} />
            }
            <FileIcon name={node.name} kind="directory" isOpen={isOpen} size={15} />
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            <span style={{ width: '10px' }} />
            <FileIcon name={node.name} extension={node.extension} kind="file" size={15} />
          </span>
        )}
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          fontSize: '13px',
        }}>{node.name}</span>
      </button>
      {node.kind === 'directory' && isOpen && node.children?.map((c) =>
        <FileTreeNode key={c.path} node={c} depth={depth + 1} />
      )}
    </div>
  );
}

export default function FileExplorer() {
  const {
    tree, rootName, isLoading,
    setRootHandle, setRootName, setRootPath, setTree, setLoading,
    saveSession, getSavedSession,
  } = useFileStore();

  // Auto-restore workspace from localStorage on mount
  useEffect(() => {
    const saved = getSavedSession();
    if (saved && !rootName) {
      (async () => {
        setLoading(true);
        try {
          const handle = await restoreDirectory(saved.path);
          if (handle) {
            setRootHandle(handle);
            setRootName(saved.name);
            setRootPath(saved.path);
            setTree(await listDirectory(handle));
          }
        } catch (e) {
          console.warn('Failed to restore workspace session:', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenFolder = useCallback(async () => {
    setLoading(true);
    try {
      const handle = await openDirectory();
      if (!handle) { setLoading(false); return; }
      setRootHandle(handle);
      setRootName(handle.name);
      setRootPath(lastOpenedPath || handle.name);
      setTree(await listDirectory(handle));
      // Persist session
      saveSession();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [setRootHandle, setRootName, setRootPath, setTree, setLoading, saveSession]);

  const handleRefresh = useCallback(async () => {
    const rh = useFileStore.getState().rootHandle;
    if (!rh) return;
    setLoading(true);
    try { setTree(await listDirectory(rh)); } finally { setLoading(false); }
  }, [setTree, setLoading]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      fontSize: '13px',
    }}>
      {/* Header - only shown when folder is not open */}
      {!rootName && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '34px',
          paddingLeft: '16px',
          paddingRight: '8px',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted, #6b7280)',
          }}>Explorer</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button title="More Actions" style={{
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--color-text-muted, #6b7280)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, background-color 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted, #6b7280)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Tree content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!rootName ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '20px 16px',
          }}>
            <p style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              lineHeight: 1.6,
              margin: 0,
            }}>
              You have not yet opened a workspace folder.
            </p>
            <button onClick={handleOpenFolder} style={{
              width: '100%',
              fontSize: '12px',
              color: '#fff',
              backgroundColor: '#007acc',
              border: 'none',
              borderRadius: '3px',
              padding: '7px 0',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background-color 0.15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f8ad2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007acc'}
            >
              Open Folder
            </button>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', width: '100%', padding: '0 4px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '34px',
              paddingLeft: '12px',
              paddingRight: '4px',
              marginBottom: '4px',
              borderBottom: '1px solid color-mix(in srgb, var(--color-border-subtle) 30%, transparent)',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-text-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {rootName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button onClick={handleRefresh} title="Refresh" style={{
                  padding: '4px',
                  borderRadius: '4px',
                  color: 'var(--color-text-muted, #6b7280)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s, background-color 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted, #6b7280)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button title="More Actions" style={{
                  padding: '4px',
                  borderRadius: '4px',
                  color: 'var(--color-text-muted, #6b7280)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s, background-color 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted, #6b7280)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <MoreHorizontal size={13} />
                </button>
              </div>
            </div>
            {tree.map((n) => <FileTreeNode key={n.path} node={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
