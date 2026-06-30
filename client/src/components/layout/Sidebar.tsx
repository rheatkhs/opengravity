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
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Search</span>
              <button className="p-1 rounded text-zinc-500 hover:text-zinc-300">
                <MoreHorizontal size={12} />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full px-2 py-1 text-xs rounded border border-zinc-700 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-zinc-500" 
              />
              <input 
                type="text" 
                placeholder="Replace" 
                className="w-full px-2 py-1 text-xs rounded border border-zinc-700 bg-zinc-900 text-zinc-200 focus:outline-none focus:border-zinc-500" 
              />
            </div>
          </div>
        )}

        {activeTab === 'git' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Source Control</span>
              <button className="p-1 rounded text-zinc-500 hover:text-zinc-300">
                <GitBranch size={12} />
              </button>
            </div>
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-zinc-400">No source control changes detected in this workspace.</p>
            </div>
          </div>
        )}

        {activeTab === 'thoughts' && <ThoughtLog />}
        {activeTab === 'config' && <AgentConfig />}
      </div>
    </div>
  );
}
