import { X } from 'lucide-react';
import { useEditorStore } from '../../stores/editor-store';
import FileIcon from '../sidebar/FileIcon';

export default function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        height: '36px',
        minHeight: '36px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const ext = tab.name.includes('.') ? tab.name.split('.').pop() || '' : '';

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '12px',
              paddingRight: '12px',
              height: '100%',
              whiteSpace: 'nowrap',
              fontSize: '11.5px',
              position: 'relative',
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              backgroundColor: isActive ? 'var(--color-bg-base)' : 'transparent',
              borderRight: '1px solid var(--color-border-subtle)',
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: 'var(--color-accent-primary)',
                }}
              />
            )}

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span
                className="animate-pulse"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: 'var(--color-accent-primary)',
                }}
              />
            )}

            <FileIcon name={tab.name} extension={ext} kind="file" size={13} />
            <span style={{
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '11.5px',
              opacity: isActive ? 1 : 0.75,
            }}>{tab.name}</span>

            {/* Close button */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              style={{
                marginLeft: '6px',
                padding: '2px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isActive ? 0.7 : 0.4,
                transition: 'opacity 0.15s, background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = isActive ? '0.7' : '0.4';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={10} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
