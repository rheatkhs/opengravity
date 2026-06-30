import { useState } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import {
  Folder,
  Search,
  GitBranch,
  MessageSquare,
  Settings,
  Bell,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import EditorPane from './components/layout/EditorPane';
import TerminalPane from './components/layout/TerminalPane';
import AgentPanel from './components/layout/AgentPanel';
import { useEditorStore } from './stores/editor-store';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [terminalVisible] = useState<boolean>(true);
  const [agentVisible] = useState<boolean>(true);

  const openTabsCount = useEditorStore((s) => s.tabs.length);

  const activityTabs = [
    { id: 'explorer', icon: Folder, label: 'Explorer', badge: openTabsCount > 0 ? openTabsCount : undefined },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'thoughts', icon: MessageSquare, label: 'Thoughts Log' },
  ];

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId) {
      // Toggle sidebar visibility
      setSidebarVisible(!sidebarVisible);
    } else {
      setActiveTab(tabId);
      setSidebarVisible(true);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-zinc-300 font-sans"
      style={{ backgroundColor: 'var(--color-bg-deep)' }}>

      {/* VS Code styled Menu Bar */}
      <header className="h-9 shrink-0 select-none text-[11px]"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}>
        {/* Flex system ensures elements stay in their bounds with natural margins */}
        <div className="w-full h-full flex items-center justify-between relative">
          {/* Left Area: Menu options */}
          <div className="flex items-center gap-0.5 h-full">
            {/* Desktop view menu items */}
            <div className="hidden lg:flex items-center gap-5 h-full">
              {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((item) => (
                <button key={item} className="px-2.5 h-[24px] flex items-center justify-center transition-colors hover:text-white cursor-pointer select-none shrink-0">
                  {item}
                </button>
              ))}
            </div>

            {/* Tablet view menu items */}
            <div className="hidden sm:flex lg:hidden items-center gap-3 h-full">
              {['File', 'Edit', 'View', 'Terminal', 'Help'].map((item) => (
                <button key={item} className="px-2.5 h-[24px] flex items-center justify-center transition-colors hover:text-white cursor-pointer select-none shrink-0">
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Center Area: Title (Centered absolutely to avoid blocking clicks or layout stream) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-[11px] font-medium tracking-wide text-zinc-400 pointer-events-none select-none">
            opengravity
          </div>
        </div>
      </header>

      {/* Main body area containing Activity Bar + Workspace Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Activity Bar (VS Code style) */}
        <div className="w-12 shrink-0 flex flex-col justify-between items-center py-2 select-none"
          style={{
            backgroundColor: 'var(--color-bg-deep)',
            borderRight: '1px solid var(--color-border-subtle)'
          }}>
          {/* Top Tabs */}
          <div className="flex flex-col gap-1 w-full items-center">
            {activityTabs.map(({ id, icon: Icon, badge, label }) => {
              const isActive = activeTab === id && sidebarVisible;
              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  title={label}
                  className="relative p-2.5 w-11 h-11 flex items-center justify-center rounded-lg transition-colors group cursor-pointer"
                  style={{
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-dimmed)',
                  }}>
                  {/* Left indicator line */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-white rounded-r animate-fade-in" />
                  )}
                  <Icon size={18} className="group-hover:text-zinc-200 transition-colors" />
                  {badge !== undefined && (
                    <span className="absolute top-1 right-1 bg-sky-600 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Tabs */}
          <div className="flex flex-col gap-2 items-center" style={{

            paddingBottom: '12px',
          }}>
            <button className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer" title="Settings" onClick={() => handleTabClick('config')}>
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Resizable panel layout */}
        <Group orientation="horizontal" className="flex-1">
          {/* Sidebar */}
          {sidebarVisible && (
            <>
              <Panel defaultSize="20%" minSize="15%" maxSize="35%">
                <Sidebar activeTab={activeTab} />
              </Panel>
              <Separator />
            </>
          )}

          {/* Editor & Terminal split */}
          <Panel defaultSize="55%" minSize="30%">
            <Group orientation="vertical">
              {/* Code Editor */}
              <Panel defaultSize="65%" minSize="25%">
                <EditorPane />
              </Panel>

              {/* Terminal Panel */}
              {terminalVisible && (
                <>
                  <Separator />
                  <Panel defaultSize="35%" minSize="15%" collapsible>
                    <TerminalPane />
                  </Panel>
                </>
              )}
            </Group>
          </Panel>

          {/* Right Panel (Agent / Chat Panel) */}
          {agentVisible && (
            <>
              <Separator />
              <Panel defaultSize="25%" minSize="20%" maxSize="45%">
                <AgentPanel />
              </Panel>
            </>
          )}
        </Group>
      </div>

      {/* VS Code styled Status Bar (Teal / Blue footer) */}
      <footer className="h-6 select-none text-[11px] shrink-0 text-white px-4"
        style={{
          backgroundColor: '#007acc',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}>
        <div className="w-full h-full flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-1.5 py-0.5 rounded cursor-pointer">
              <GitBranch size={11} />
              <span className="font-medium">main</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85, paddingLeft: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <XCircle size={11} />
                <span>0</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <AlertTriangle size={11} />
                <span>0</span>
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <span className="cursor-pointer">UTF-8</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer">
              <span>Opengravity Workspace</span>
            </div>
            <Bell size={11} className="cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
