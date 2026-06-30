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
      <div className="flex flex-col items-center py-2 gap-1 w-10 shrink-0"
        style={{ borderRight: '1px solid var(--color-border-subtle)' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} title={label}
            className="p-2 rounded-md transition-colors duration-150"
            style={{
              color: activeTab === id ? 'var(--color-text-primary)' : 'var(--color-text-dimmed)',
              backgroundColor: activeTab === id ? 'var(--color-bg-hover)' : 'transparent',
            }}>
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'config' && <AgentConfig />}
        {activeTab === 'thoughts' && <ThoughtLog />}
      </div>
    </div>
  );
}
