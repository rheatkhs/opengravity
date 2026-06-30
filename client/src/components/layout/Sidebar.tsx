import { useState } from 'react';
import { Files, Settings, MessageSquare } from 'lucide-react';
import FileExplorer from '../sidebar/FileExplorer';
import AgentConfig from '../sidebar/AgentConfig';
import ThoughtLog from '../sidebar/ThoughtLog';

type SidebarTab = 'files' | 'config' | 'thoughts';

const tabs: { id: SidebarTab; icon: typeof Files; label: string }[] = [
  { id: 'files', icon: Files, label: 'Files' },
  { id: 'config', icon: Settings, label: 'Config' },
  { id: 'thoughts', icon: MessageSquare, label: 'Thoughts' },
];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
      {/* Icon rail */}
      <div className="flex flex-col items-center py-3 gap-2 w-12 shrink-0 select-none"
        style={{ borderRight: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-deep)' }}>
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} title={label}
              className="relative p-2.5 rounded-lg transition-all duration-200 group hover:scale-105"
              style={{
                color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-dimmed)',
                backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
              }}>
              {/* Active Tab Left Border Accent Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r"
                  style={{ backgroundColor: 'var(--color-accent-primary)' }} />
              )}
              <Icon size={18} className="transition-transform duration-200 group-hover:opacity-100" style={{ opacity: isActive ? 1 : 0.65 }} />
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'config' && <AgentConfig />}
        {activeTab === 'thoughts' && <ThoughtLog />}
      </div>
    </div>
  );
}
