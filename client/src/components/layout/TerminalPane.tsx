import { useState } from 'react';
import { 
  Plus, 
  ChevronDown, 
  Trash2, 
  MoreHorizontal,
  X
} from 'lucide-react';
import TerminalComponent from '../terminal/Terminal';

export default function TerminalPane() {
  const [sessionKey, setSessionKey] = useState(0);

  const handleClear = () => {
    setSessionKey((prev) => prev + 1);
  };

  const tabs = ['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'];

  return (
    <div className="flex flex-col h-full overflow-hidden" 
      style={{ backgroundColor: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border-subtle)' }}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-3 h-9 shrink-0 select-none text-[11px]"
        style={{ 
          borderBottom: '1px solid var(--color-border-subtle)', 
          backgroundColor: 'var(--color-bg-surface)',
          color: 'var(--color-text-secondary)'
        }}>
        
        {/* Left: VS Code terminal tabs */}
        <div className="flex items-center gap-4 h-full">
          {tabs.map((tab) => {
            const isTabActive = tab === 'TERMINAL';
            return (
              <div key={tab} 
                className="relative flex items-center h-full cursor-pointer px-1 font-semibold text-[10px] tracking-wide"
                style={{ 
                  color: isTabActive ? 'var(--color-text-primary)' : 'var(--color-text-dimmed)',
                }}>
                <span>{tab}</span>
                {isTabActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: VS Code terminal controls */}
        <div className="flex items-center gap-2">
          {/* Shell pill */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border"
            style={{ 
              backgroundColor: 'var(--color-bg-deep)', 
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-secondary)'
            }}>
            <span>powershell</span>
            <ChevronDown size={10} />
          </div>

          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors text-zinc-500 hover:bg-zinc-800" title="New Terminal">
            <Plus size={13} />
          </button>
          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors text-zinc-500 hover:bg-zinc-800" title="Split Terminal">
            <ChevronDown size={13} />
          </button>
          <button onClick={handleClear} className="p-1 hover:text-white rounded cursor-pointer transition-colors text-zinc-500 hover:bg-zinc-800" title="Clear Terminal">
            <Trash2 size={13} />
          </button>
          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors text-zinc-500 hover:bg-zinc-800" title="More Actions">
            <MoreHorizontal size={13} />
          </button>
          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors text-zinc-500 hover:bg-zinc-800" title="Kill Terminal">
            <X size={13} />
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
