import { useRef, useEffect } from 'react';
import { useAgentStore } from '../../stores/agent-store';

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
    <div className="h-full flex flex-col">
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Thought Log
        </span>
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
