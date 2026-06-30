import { useRef, useEffect } from 'react';
import { useAgentStore } from '../../stores/agent-store';
import { RefreshCw } from 'lucide-react';

export default function ThoughtLog() {
  const thoughts = useAgentStore((s) => s.thoughts);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  const typeColors: Record<string, string> = {
    reasoning: 'var(--color-accent-primary)',
    plan: 'var(--color-info)',
    observation: 'var(--color-success)',
    error: 'var(--color-error)',
  };

  return (
    <div className="h-full flex flex-col select-none text-[11px]" style={{
      paddingLeft: '12px',
      paddingRight: '12px'
    }}>
      <div className="flex items-center justify-between h-9 px-4 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Thought Log</span>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer" title="Clear">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {thoughts.length === 0 ? (
          <p className="text-[11px] text-center py-8" style={{ color: 'var(--color-text-dimmed)' }}>
            Agent thoughts will appear here
          </p>
        ) : (
          thoughts.map((t) => (
            <div key={t.id} className="text-[11px] p-2 rounded-md" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColors[t.type] || 'var(--color-text-muted)' }} />
                <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: typeColors[t.type] }}>{t.type}</span>
                <span className="text-[9px] ml-auto" style={{ color: 'var(--color-text-dimmed)' }}>
                  {new Date(t.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
