import FileExplorer from '../sidebar/FileExplorer';
import AgentConfig from '../sidebar/AgentConfig';
import ThoughtLog from '../sidebar/ThoughtLog';
import { GitBranch, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-bg-surface)'
    }}>
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'explorer' && <FileExplorer />}

        {activeTab === 'search' && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
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
              }}>Search</span>
              <button
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
                <MoreHorizontal size={13} />
              </button>
            </div>
            <div style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <input
                type="text"
                placeholder="Search"
                style={{
                  width: '100%',
                  fontSize: '12px',
                  borderRadius: '3px',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-deep)',
                  color: 'var(--color-text-primary)',
                  padding: '5px 8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                }}
              />
              <input
                type="text"
                placeholder="Replace"
                style={{
                  width: '100%',
                  fontSize: '12px',
                  borderRadius: '3px',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-deep)',
                  color: 'var(--color-text-primary)',
                  padding: '5px 8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'git' && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
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
              }}>Source Control</span>
              <button
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
                <GitBranch size={13} />
              </button>
            </div>
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              userSelect: 'none'
            }}>
              <p style={{
                fontSize: '11px',
                color: 'var(--color-text-muted, #6b7280)',
                lineHeight: '1.4',
                margin: 0
              }}>No source control changes detected in this workspace.</p>
            </div>
          </div>
        )}

        {activeTab === 'thoughts' && <ThoughtLog />}
        {activeTab === 'config' && <AgentConfig />}
      </div>
    </div>
  );
}

