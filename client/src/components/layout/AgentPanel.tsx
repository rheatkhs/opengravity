import { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Zap, 
  Send, 
  ShieldAlert, 
  Check, 
  Plus, 
  History, 
  MoreHorizontal, 
  ArrowLeft, 
  Mic, 
  Sparkles, 
  ChevronDown 
} from 'lucide-react';
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

  // Find unique file paths edited from successful tool calls
  const editedFiles = Array.from(
    new Set(
      toolCalls
        .filter((tc) => tc.toolName === 'patch_file' && tc.status === 'success' && tc.args?.path)
        .map((tc) => tc.args.path)
    )
  );

  return (
    <div className="h-full flex flex-col overflow-hidden text-[11px]" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
      {/* VS Code Panel Header */}
      <div className="px-3 py-2 shrink-0 flex items-center justify-between select-none" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <span className="font-bold text-zinc-100 uppercase tracking-wide">Antigravity Chat</span>
        
        <div className="flex items-center gap-2 text-zinc-400">
          {/* Status Indicator */}
          <span className="flex items-center gap-1 mr-1 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status] }} />
            <span className="text-[9px] uppercase tracking-wider font-mono font-medium" style={{ color: statusColors[status] }}>{status}</span>
          </span>
          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors" title="New Session">
            <Plus size={13} />
          </button>
          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors" title="History">
            <History size={13} />
          </button>
          <button className="p-1 hover:text-white rounded cursor-pointer transition-colors" title="More Actions">
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Changes Header Section */}
      <div className="px-3 py-1.5 shrink-0 flex items-center justify-between select-none" 
        style={{ backgroundColor: 'var(--color-bg-deep)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
          <ArrowLeft size={11} className="cursor-pointer hover:text-white" />
          <span>{editedFiles.length} Files With Changes</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">Reject all</button>
          <button className="bg-[#007acc] text-white px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-sky-600 transition-colors cursor-pointer">Accept all</button>
        </div>
      </div>

      {/* Goal details if active */}
      {objective && (
        <div className="px-3 py-2 shrink-0 select-none border-b border-zinc-800" style={{ backgroundColor: 'var(--color-bg-deep)' }}>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Active Objective</span>
          <p className="text-[10px] text-zinc-300 leading-normal">{objective}</p>
        </div>
      )}

      {/* Progress metrics */}
      <div className="px-3 py-1.5 shrink-0 flex items-center justify-between select-none text-[9px] border-b border-zinc-800 text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span>STEPS:</span>
          <span className="font-mono text-zinc-400">{currentStep} / {maxSteps}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>BUDGET:</span>
          <span className="font-mono text-zinc-400">{consecutiveCommands} / {commandBudget}</span>
        </div>
      </div>

      {/* Tool Call Stream / Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {toolCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30 select-none">
            <Zap size={22} style={{ color: 'var(--color-text-dimmed)' }} />
            <p className="text-[10px] tracking-wide" style={{ color: 'var(--color-text-dimmed)' }}>AGENT PIPELINE INACTIVE</p>
          </div>
        ) : (
          toolCalls.map((tc) => (
            <div key={tc.id} className="p-2.5 rounded border text-[11px] transition-all duration-150 animate-fade-in"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: tc.status === 'error' ? 'var(--color-error)' : 'var(--color-border-subtle)'
              }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  backgroundColor: tc.status === 'success' ? 'var(--color-success)' : tc.status === 'error' ? 'var(--color-error)' : tc.status === 'running' ? 'var(--color-warning)' : 'var(--color-text-dimmed)'
                }} />
                <span className="font-mono font-semibold text-zinc-200" style={{ color: 'var(--color-text-primary)' }}>{tc.toolName}</span>
                {tc.duration && <span className="ml-auto text-[9px] font-mono text-zinc-500">{tc.duration}ms</span>}
              </div>
              
              {tc.args && (
                <div className="font-mono text-[9px] mt-1 p-1 rounded bg-zinc-950 text-zinc-500">
                  {JSON.stringify(tc.args, null, 1)}
                </div>
              )}

              {tc.result && (
                <pre className="text-[9px] mt-1.5 p-1 rounded overflow-x-auto whitespace-pre-wrap max-h-24 border bg-zinc-950 border-zinc-800 text-emerald-400">
                  {tc.result}
                </pre>
              )}
              {tc.error && <p className="text-[9px] mt-1.5 font-medium text-red-400">{tc.error}</p>}
            </div>
          ))
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-surface)' }}>
        {status === 'paused' && resumeHandler ? (
          <div className="flex flex-col gap-2 animate-fade-in p-2 rounded border border-amber-600/50 bg-amber-950/20">
            <div className="flex items-center gap-1.5 text-amber-500">
              <ShieldAlert size={14} />
              <span className="text-[9px] font-semibold uppercase tracking-wider font-mono">Safety Halt Triggered</span>
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-400">
              The agent has run {consecutiveCommands} consecutive commands. Click approve to authorize the next commands.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => resumeHandler()}
                className="flex-1 py-1 px-3 rounded text-[11px] font-semibold text-white flex items-center justify-center gap-1 bg-[#007acc] hover:bg-sky-600 transition-colors cursor-pointer">
                <Check size={12} /> Approve & Resume
              </button>
              <button onClick={handleStop}
                className="py-1 px-3 rounded text-[11px] font-semibold border flex items-center justify-center gap-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer">
                Abort
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col border border-zinc-700 rounded-lg bg-zinc-900 p-2 gap-2 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={status === 'running'}
              placeholder={status === 'running' ? "Agent processing..." : "Ask anything..."}
              rows={2}
              className="w-full text-xs bg-transparent text-zinc-200 focus:outline-none resize-none placeholder-zinc-600 leading-relaxed font-sans"
            />
            
            {/* Sub-toolbar inside the input container */}
            <div className="flex items-center justify-between select-none">
              {/* Left tools */}
              <div className="flex items-center gap-1.5">
                <button className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Plus size={13} />
                </button>
                {/* Fast speed pill */}
                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[8px] font-semibold border border-zinc-700">
                  <Sparkles size={8} className="text-zinc-400" />
                  <span>Fast</span>
                </div>
                {/* Model dropdown */}
                <div className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer pl-1">
                  <span>Gemini 3.1 Flash Lite</span>
                  <ChevronDown size={8} />
                </div>
              </div>
              
              {/* Right tools */}
              <div className="flex items-center gap-1">
                <button className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Mic size={13} />
                </button>
                {status === 'running' ? (
                  <button onClick={handleStop} title="Abort Mission"
                    className="p-1 rounded bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer">
                    <Square size={11} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} title="Send Message"
                    disabled={!input.trim()}
                    className="p-1 rounded flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      backgroundColor: input.trim() ? '#007acc' : 'transparent',
                      color: input.trim() ? 'white' : 'var(--color-text-dimmed)'
                    }}>
                    <Send size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
