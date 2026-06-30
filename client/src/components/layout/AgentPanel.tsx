import { useState, useRef, useEffect } from 'react';
import { Square, Zap, Send, ShieldAlert, Check } from 'lucide-react';
import { useAgentStore } from '../../stores/agent-store';
import { runAgentLoop } from '../../agent/agent-loop';

export default function AgentPanel() {
  const { status, objective, currentStep, maxSteps, consecutiveCommands, commandBudget, toolCalls, resumeHandler } = useAgentStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll tool stream to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolCalls]);

  const statusColors: Record<string, string> = {
    idle: 'var(--color-text-dimmed)',
    running: 'var(--color-success)',
    paused: 'var(--color-warning)',
    error: 'var(--color-error)',
    complete: 'var(--color-accent-primary)',
  };

  const handleSubmit = () => {
    if (!input.trim() || status === 'running' || status === 'paused') return;
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
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
      {/* Header */}
      <div className="px-3 py-2 shrink-0 flex items-center gap-2 select-none" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <Zap size={13} style={{ color: 'var(--color-accent-primary)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>Gravity Agent</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status] }} />
          <span className="text-[9px] uppercase tracking-wider font-mono font-medium" style={{ color: statusColors[status] }}>{status}</span>
        </span>
      </div>

      {/* Objective */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-deep)' }}>
        <label className="text-[9px] uppercase tracking-wider font-mono font-semibold block mb-1" style={{ color: 'var(--color-text-muted)' }}>Active Goal</label>
        {objective ? (
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{objective}</p>
        ) : (
          <p className="text-[11px] italic" style={{ color: 'var(--color-text-dimmed)' }}>Awaiting task prompt...</p>
        )}
      </div>

      {/* Step Budget */}
      <div className="px-3 py-2 shrink-0 flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex-1">
          <div className="flex justify-between text-[9px] font-mono mb-1 select-none">
            <span style={{ color: 'var(--color-text-muted)' }}>STEPS</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{currentStep} / {maxSteps}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentStep / maxSteps) * 100, 100)}%`, backgroundColor: currentStep / maxSteps > 0.8 ? 'var(--color-warning)' : 'var(--color-accent-primary)' }} />
          </div>
        </div>
        <div className="text-right shrink-0 select-none">
          <div className="text-[9px] font-mono" style={{ color: 'var(--color-text-muted)' }}>CMDS</div>
          <div className="text-xs font-mono font-semibold" style={{ color: consecutiveCommands >= commandBudget ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
            {consecutiveCommands} / {commandBudget}
          </div>
        </div>
      </div>

      {/* Tool Call Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {toolCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30 select-none">
            <Zap size={22} style={{ color: 'var(--color-text-dimmed)' }} />
            <p className="text-[10px] tracking-wide" style={{ color: 'var(--color-text-dimmed)' }}>AGENT PIPELINE INACTIVE</p>
          </div>
        ) : (
          toolCalls.map((tc) => (
            <div key={tc.id} className="p-2.5 rounded-lg border text-[11px] transition-all duration-150 animate-fade-in"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: tc.status === 'error' ? 'var(--color-error)' : 'var(--color-border-subtle)'
              }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  backgroundColor: tc.status === 'success' ? 'var(--color-success)' : tc.status === 'error' ? 'var(--color-error)' : tc.status === 'running' ? 'var(--color-warning)' : 'var(--color-text-dimmed)'
                }} />
                <span className="font-mono font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{tc.toolName}</span>
                {tc.duration && <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--color-text-dimmed)' }}>{tc.duration}ms</span>}
              </div>
              
              {/* Render arguments snippet */}
              {tc.args && (
                <div className="font-mono text-[9px] mt-1 p-1 rounded" style={{ backgroundColor: 'var(--color-bg-deep)', color: 'var(--color-text-muted)' }}>
                  {JSON.stringify(tc.args, null, 1)}
                </div>
              )}

              {tc.result && (
                <pre className="text-[9px] mt-1.5 p-1 rounded overflow-x-auto whitespace-pre-wrap max-h-24 border"
                  style={{ backgroundColor: 'var(--color-bg-deep)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-success)' }}>
                  {tc.result}
                </pre>
              )}
              {tc.error && <p className="text-[9px] mt-1.5 font-medium" style={{ color: 'var(--color-error)' }}>{tc.error}</p>}
            </div>
          ))
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-deep)' }}>
        {status === 'paused' && resumeHandler ? (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <div className="flex items-center gap-1.5 text-amber-500">
              <ShieldAlert size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">Safety Halt Triggered</span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              The agent has run {consecutiveCommands} consecutive commands. Click approve to authorize the next commands.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => resumeHandler()}
                className="flex-1 py-1.5 px-3 rounded-md text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:brightness-110 hover:shadow-lg cursor-pointer"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                <Check size={12} /> Approve & Resume
              </button>
              <button onClick={handleStop}
                className="py-1.5 px-3 rounded-md text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:bg-[var(--color-bg-hover)] cursor-pointer"
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
                Abort
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={status === 'running'}
              placeholder={status === 'running' ? "Agent processing..." : "Describe objective to execute..."}
              className="flex-1 px-3 py-1.5 text-xs rounded-md focus:outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
                opacity: status === 'running' ? 0.6 : 1
              }} />
            {status === 'running' ? (
              <button onClick={handleStop} title="Abort Mission"
                className="p-2 rounded-md hover:bg-red-600 transition-colors duration-150 cursor-pointer text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-error)' }}>
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleSubmit} title="Launch Agent"
                disabled={!input.trim()}
                className="p-2 rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: input.trim() ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)',
                  color: input.trim() ? 'white' : 'var(--color-text-dimmed)',
                  border: input.trim() ? 'none' : '1px solid var(--color-border-default)'
                }}>
                <Send size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
