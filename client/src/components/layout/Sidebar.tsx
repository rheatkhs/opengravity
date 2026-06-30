import FileExplorer from '../sidebar/FileExplorer';
import AgentConfig from '../sidebar/AgentConfig';
import ThoughtLog from '../sidebar/ThoughtLog';
import { GitBranch, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'explorer' && <FileExplorer />}

        {activeTab === 'search' && (
          <div className="h-full flex flex-col" style={{
            paddingLeft: '12px',
            paddingRight: '12px'
          }}>
            <div className="flex items-center justify-between h-9 px-4 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Search</span>
              <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                <MoreHorizontal size={13} />
              </button>
            </div>
            <div className="p-4" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <input
                type="text"
                placeholder="Search"
                className="w-full text-xs rounded-[3px] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
                style={{
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  paddingLeft: '10px',
                  paddingRight: '10px'
                }}
              />
              <input
                type="text"
                placeholder="Replace"
                className="w-full text-xs rounded-[3px] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
                style={{
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  paddingLeft: '10px',
                  paddingRight: '10px'
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'git' && (
          <div className="h-full flex flex-col" style={{
            paddingLeft: '12px',
            paddingRight: '12px'
          }}>
            <div className="flex items-center justify-between h-9 px-4 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Source Control</span>
              <button className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                <GitBranch size={13} />
              </button>
            </div>
            <div className="p-6 text-center select-none">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">No source control changes detected in this workspace.</p>
            </div>
          </div>
        )}

        {activeTab === 'thoughts' && <ThoughtLog />}
        {activeTab === 'config' && <AgentConfig />}
      </div>
    </div>
  );
}
