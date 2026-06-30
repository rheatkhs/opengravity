import { X } from 'lucide-react';
import { useEditorStore } from '../../stores/editor-store';

export default function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-center overflow-x-auto"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        height: '36px',
        minHeight: '36px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group flex items-center gap-1.5 px-3 h-full whitespace-nowrap text-xs transition-colors duration-150 relative shrink-0"
            style={{
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              backgroundColor: isActive ? 'var(--color-bg-base)' : 'transparent',
              borderRight: '1px solid var(--color-border-subtle)',
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}
              />
            )}

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}
              />
            )}

            <span className="font-mono">{tab.name}</span>

            {/* Close button */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded transition-opacity duration-100 hover:bg-[var(--color-bg-hover)]"
            >
              <X size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
