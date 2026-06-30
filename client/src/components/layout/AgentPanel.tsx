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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      fontSize: '11px',
      backgroundColor: 'var(--color-bg-surface)'
    }}>
      {/* VS Code Panel Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '12px',
        paddingRight: '12px',
        height: '36px',
        flexShrink: 0,
        userSelect: 'none',
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opengravity Chat</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Indicator */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px', fontSize: '10px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColors[status] }} />
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace', fontWeight: '500', color: statusColors[status] }}>{status}</span>
          </span>
          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="New Session">
            <Plus size={13} />
          </button>
          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="History">
            <History size={13} />
          </button>
          <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }} title="More Actions">
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Changes Header Section */}
      {editedFiles.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '12px',
          height: '28px',
          flexShrink: 0,
          userSelect: 'none',
          backgroundColor: 'var(--color-bg-deep)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
            <ArrowLeft size={11} className="cursor-pointer hover:text-[var(--color-text-primary)] transition-colors" />
            <span>{editedFiles.length} file{editedFiles.length !== 1 ? 's' : ''} modified</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              style={{ fontSize: '10px', color: 'var(--color-text-muted)', border: 'none', backgroundColor: 'transparent', padding: 0 }}>Reject all</button>
            <button className="hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'white',
                paddingTop: '2px',
                paddingBottom: '2px',
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600',
                border: 'none'
              }}>Accept all</button>
          </div>
        </div>
      )}

      {/* Goal details if active */}
      {objective && (
        <div style={{
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: '8px',
          paddingBottom: '8px',
          flexShrink: 0,
          userSelect: 'none',
          backgroundColor: 'var(--color-bg-deep)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Active Objective</span>
          <p style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{objective}</p>
        </div>
      )}

      {/* Progress metrics */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '6px',
        paddingBottom: '6px',
        flexShrink: 0,
        userSelect: 'none',
        fontSize: '9px',
        backgroundColor: 'var(--color-bg-deep)',
        borderBottom: '1px solid var(--color-border-subtle)',
        color: 'var(--color-text-dimmed)',
        fontWeight: 'bold',
        letterSpacing: '0.05em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>STEPS:</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)', fontSize: '10px' }}>{currentStep} / {maxSteps}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>BUDGET:</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)', fontSize: '10px' }}>{consecutiveCommands} / {commandBudget}</span>
        </div>
      </div>

      {/* Tool Call Stream / Messages area */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toolCalls.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px',
            opacity: 0.25,
            userSelect: 'none'
          }}>
            <Zap size={20} style={{ color: 'var(--color-text-dimmed)' }} />
            <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--color-text-dimmed)' }}>AGENT PIPELINE INACTIVE</p>
          </div>
        ) : (
          toolCalls.map((tc) => (
            <div key={tc.id} className="animate-fade-in"
              style={{
                padding: '10px',
                borderRadius: '4px',
                fontSize: '11px',
                border: '1px solid',
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: tc.status === 'error' ? 'var(--color-error)' : 'var(--color-border-subtle)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 150ms ease'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: tc.status === 'success' ? 'var(--color-success)' : tc.status === 'error' ? 'var(--color-error)' : tc.status === 'running' ? 'var(--color-warning)' : 'var(--color-text-dimmed)'
                }} />
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{tc.toolName}</span>
                {tc.duration && <span style={{ marginLeft: 'auto', fontSize: '9px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{tc.duration}ms</span>}
              </div>

              {tc.args && (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  marginTop: '6px',
                  padding: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--color-bg-deep)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  overflowX: 'auto'
                }}>
                  {JSON.stringify(tc.args, null, 1)}
                </div>
              )}

              {tc.result && (
                <pre style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  marginTop: '6px',
                  padding: '6px',
                  borderRadius: '3px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '96px',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-deep)',
                  color: '#34d399'
                }}>
                  {tc.result}
                </pre>
              )}
              {tc.error && <p style={{ fontSize: '9px', marginTop: '6px', fontWeight: '500', color: 'var(--color-error)' }}>{tc.error}</p>}
            </div>
          ))
        )}
      </div>

      {/* Bottom Action Area */}
      <div style={{
        padding: '12px',
        flexShrink: 0,
        borderTop: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        {status === 'paused' && resumeHandler ? (
          <div className="animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid rgba(230, 140, 10, 0.3)',
            backgroundColor: 'rgba(230, 140, 10, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)' }}>
              <ShieldAlert size={14} />
              <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>Safety Halt Triggered</span>
            </div>
            <p style={{ fontSize: '10px', lineHeight: '1.5', color: 'var(--color-text-secondary)', margin: 0 }}>
              The agent has run {consecutiveCommands} consecutive commands. Click approve to authorize the next commands.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => resumeHandler()} className="hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: 'var(--color-accent-primary)',
                  border: 'none'
                }}>
                <Check size={12} /> Approve & Resume
              </button>
              <button onClick={handleStop} className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border-default)'
                }}>
                Abort
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--color-border-default)',
            borderRadius: '6px',
            backgroundColor: 'var(--color-bg-deep)',
            padding: '8px',
            gap: '8px',
            position: 'relative'
          }}>
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
              style={{
                width: '100%',
                fontSize: '12px',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                border: 'none',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.5',
                fontFamily: 'var(--font-sans)'
              }}
            />

            {/* Sub-toolbar inside the input container */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
              {/* Left tools */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }}>
                  <Plus size={13} />
                </button>
                {/* Fast speed pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  paddingLeft: '5px',
                  paddingRight: '5px',
                  paddingTop: '1px',
                  paddingBottom: '1px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--color-bg-hover)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '8px',
                  fontWeight: '600',
                  border: '1px solid var(--color-border-subtle)'
                }}>
                  <Sparkles size={8} style={{ color: 'var(--color-text-muted)' }} />
                  <span>Fast</span>
                </div>
                {/* Model dropdown */}
                <div className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>
                  <span>Gemini 3.1 Flash Lite</span>
                  <ChevronDown size={8} />
                </div>
              </div>

              {/* Right tools */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }}>
                  <Mic size={13} />
                </button>
                {status === 'running' ? (
                  <button onClick={handleStop} title="Abort Mission" className="hover:bg-red-500 transition-colors cursor-pointer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '3px', border: 'none', backgroundColor: 'var(--color-error)', color: 'white' }}>
                    <Square size={11} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} title="Send Message"
                    disabled={!input.trim()}
                    className="transition-colors cursor-pointer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '3px',
                      border: 'none',
                      backgroundColor: input.trim() ? 'var(--color-accent-primary)' : 'transparent',
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
