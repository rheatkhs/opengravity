import { useState, useRef } from 'react';
import { Play, Square, Zap, Send } from 'lucide-react';
import { useAgentStore } from '../../stores/agent-store';
import { runAgentLoop } from '../../agent/agent-loop';

export default function AgentPanel() {
  const { status, objective, currentStep, maxSteps, consecutiveCommands, commandBudget, toolCalls } = useAgentStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const statusColors: Record<string, string> = {
    idle: 'var(--color-text-dimmed)',
    running: 'var(--color-success)',
    paused: 'var(--color-warning)',
    error: 'var(--color-error)',
    complete: 'var(--color-accent-primary)',
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    const objective = input.trim();
    setInput('');
    abortRef.current = new AbortController();
    runAgentLoop(objective, abortRef.current.signal);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    useAgentStore.getState().setStatus('idle');
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <Zap size={14} style={{ color: 'var(--color-accent-primary)' }} />
        <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Gravity Control</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status] }} />
          <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: statusColors[status] }}>{status}</span>
        </span>
      </div>

      {/* Objective */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Objective</label>
        {objective ? (
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{objective}</p>
        ) : (
          <p className="text-[11px]" style={{ color: 'var(--color-text-dimmed)' }}>No active objective</p>
        )}
      </div>

      {/* Step Budget */}
      <div className="px-3 py-2 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: 'var(--color-text-muted)' }}>Steps</span>
            <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{currentStep}/{maxSteps}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / maxSteps) * 100}%`, backgroundColor: currentStep / maxSteps > 0.8 ? 'var(--color-warning)' : 'var(--color-accent-primary)' }} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Cmds</div>
          <div className="text-xs font-mono" style={{ color: consecutiveCommands >= commandBudget ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
            {consecutiveCommands}/{commandBudget}
          </div>
        </div>
      </div>

      {/* Tool Call Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {toolCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Zap size={24} style={{ color: 'var(--color-text-dimmed)', opacity: 0.3 }} />
            <p className="text-[11px]" style={{ color: 'var(--color-text-dimmed)' }}>Tool invocations will appear here</p>
          </div>
        ) : (
          toolCalls.map((tc) => (
            <div key={tc.id} className="p-2 rounded-md text-[11px]" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: tc.status === 'success' ? 'var(--color-success)' : tc.status === 'error' ? 'var(--color-error)' : tc.status === 'running' ? 'var(--color-warning)' : 'var(--color-text-dimmed)'
                }} />
                <span className="font-mono font-semibold" style={{ color: 'var(--color-accent-primary)' }}>{tc.toolName}</span>
                {tc.duration && <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--color-text-dimmed)' }}>{tc.duration}ms</span>}
              </div>
              {tc.result && <pre className="text-[10px] mt-1 overflow-x-auto whitespace-pre-wrap" style={{ color: 'var(--color-text-muted)' }}>{tc.result.slice(0, 200)}</pre>}
              {tc.error && <p className="text-[10px] mt-1" style={{ color: 'var(--color-error)' }}>{tc.error}</p>}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-1.5">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Describe your objective..."
            className="flex-1 px-2.5 py-1.5 text-xs rounded-md"
            style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }} />
          {status === 'running' ? (
            <button onClick={handleStop} className="p-1.5 rounded-md"
              style={{ backgroundColor: 'var(--color-error)', color: 'white' }}><Square size={14} /></button>
          ) : (
            <button onClick={handleSubmit} className="p-1.5 rounded-md"
              style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>
              {input.trim() ? <Play size={14} /> : <Send size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
