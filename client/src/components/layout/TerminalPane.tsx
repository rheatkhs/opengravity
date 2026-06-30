import { useState } from 'react';
import { Terminal as TermIcon, Trash2, RotateCw } from 'lucide-react';
import TerminalComponent from '../terminal/Terminal';

export default function TerminalPane() {
  const [sessionKey, setSessionKey] = useState(0);

  const handleClear = () => {
    setSessionKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* Header toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 select-none"
        style={{ borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-surface)' }}>
        <TermIcon size={12} style={{ color: 'var(--color-accent-primary)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Terminal</span>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Action: Clear */}
          <button onClick={handleClear} title="Clear Session"
            className="p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors duration-150"
            style={{ color: 'var(--color-text-muted)' }}>
            <Trash2 size={12} className="hover:text-white" />
          </button>
          {/* Action: Restart */}
          <button onClick={handleClear} title="Restart Shell"
            className="p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors duration-150"
            style={{ color: 'var(--color-text-muted)' }}>
            <RotateCw size={12} className="hover:text-white" />
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div className="flex-1 overflow-hidden">
        <TerminalComponent key={sessionKey} />
      </div>
    </div>
  );
}
