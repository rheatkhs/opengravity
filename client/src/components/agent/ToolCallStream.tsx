import { useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import type { ToolCallEntry } from '../../types/agent';

interface ToolCallStreamProps {
  toolCalls: ToolCallEntry[];
}

export function ToolCallStream({ toolCalls }: ToolCallStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll tool stream to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolCalls]);

  return (
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
  );
}
