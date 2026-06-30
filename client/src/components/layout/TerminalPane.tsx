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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border-subtle)' }}>
      {/* Header toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px',
        paddingRight: '16px',
        height: '36px',
        flexShrink: 0,
        userSelect: 'none',
        fontSize: '11px',
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
        color: 'var(--color-text-secondary)'
      }}>

        {/* Left: VS Code terminal tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
          {tabs.map((tab) => {
            const isTabActive = tab === 'TERMINAL';
            return (
              <div key={tab}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  fontWeight: '600',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: isTabActive ? 'var(--color-text-primary)' : 'var(--color-text-dimmed)',
                }}>
                <span>{tab}</span>
                {isTabActive && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-accent-primary)', borderTopLeftRadius: '2px', borderTopRightRadius: '2px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: VS Code terminal controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Shell pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            paddingTop: '2px',
            paddingBottom: '2px',
            paddingLeft: '6px',
            paddingRight: '6px',
            borderRadius: '3px',
            fontSize: '10px',
            fontFamily: 'monospace',
            border: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-deep)',
            color: 'var(--color-text-secondary)'
          }}>
            <span>powershell</span>
            <ChevronDown size={10} />
          </div>

          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="New Terminal">
            <Plus size={13} />
          </button>
          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="Split Terminal">
            <ChevronDown size={13} />
          </button>
          <button onClick={handleClear} className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="Clear Terminal">
            <Trash2 size={13} />
          </button>
          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="More Actions">
            <MoreHorizontal size={13} />
          </button>
          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="Kill Terminal">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TerminalComponent key={sessionKey} />
      </div>
    </div>
  );
}
