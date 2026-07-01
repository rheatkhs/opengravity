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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '34px',
        paddingLeft: '16px',
        paddingRight: '8px',
        flexShrink: 0,
        borderBottom: '1px solid color-mix(in srgb, var(--color-border-subtle) 30%, transparent)'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-text-muted, #6b7280)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>Thought Log</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            title="Clear"
            style={{
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--color-text-muted, #6b7280)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, background-color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#d4d4d8';
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted, #6b7280)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {thoughts.length === 0 ? (
          <p style={{
            fontSize: '11px',
            textAlign: 'center',
            padding: '32px 0',
            margin: 0,
            color: 'var(--color-text-dimmed)'
          }}>
            Agent thoughts will appear here
          </p>
        ) : (
          thoughts.map((t) => (
            <div
              key={t.id}
              style={{
                fontSize: '11px',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: typeColors[t.type] || 'var(--color-text-muted)'
                }} />
                <span style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  color: typeColors[t.type]
                }}>{t.type}</span>
                <span style={{
                  fontSize: '9px',
                  color: 'var(--color-text-dimmed)',
                  marginLeft: 'auto'
                }}>
                  {new Date(t.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.4',
                margin: 0,
                color: 'var(--color-text-secondary)'
              }}>{t.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

