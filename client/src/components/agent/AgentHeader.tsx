import { Plus, History, MoreHorizontal } from 'lucide-react';
import type { AgentStatus } from '../../types/agent';

interface AgentHeaderProps {
  status: AgentStatus;
  statusColors: Record<AgentStatus, string>;
}

export function AgentHeader({ status, statusColors }: AgentHeaderProps) {
  return (
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
  );
}
