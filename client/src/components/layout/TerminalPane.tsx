import { useState } from 'react';
import { Terminal as TermIcon, ChevronDown, ChevronUp } from 'lucide-react';
import TerminalComponent from '../terminal/Terminal';

export default function TerminalPane() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* Header */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-3 py-1.5 w-full text-left transition-colors duration-100"
        style={{ borderTop: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-surface)' }}>
        <TermIcon size={12} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Terminal</span>
        <span className="ml-auto">
          {collapsed ? <ChevronUp size={12} style={{ color: 'var(--color-text-dimmed)' }} /> : <ChevronDown size={12} style={{ color: 'var(--color-text-dimmed)' }} />}
        </span>
      </button>

      {/* Terminal body */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden">
          <TerminalComponent />
        </div>
      )}
    </div>
  );
}
