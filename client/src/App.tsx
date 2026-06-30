import { useState } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { 
  Folder, 
  Search, 
  GitBranch, 
  MessageSquare, 
  Settings, 
  Cloud,
  Bell,
  Minus,
  Square,
  X
} from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import EditorPane from './components/layout/EditorPane';
import TerminalPane from './components/layout/TerminalPane';
import AgentPanel from './components/layout/AgentPanel';
import { useEditorStore } from './stores/editor-store';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [terminalVisible, setTerminalVisible] = useState<boolean>(true);
  const [agentVisible, setAgentVisible] = useState<boolean>(true);
  
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
      <header className="flex items-center justify-between h-9 px-3 shrink-0 select-none select-none text-[11px]"
        style={{ 
          backgroundColor: 'var(--color-bg-surface)', 
          borderBottom: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-secondary)'
        }}>
        
        {/* Left: Menu options */}
        <div className="flex items-center gap-1.5 h-full">
          <Cloud size={13} className="text-sky-500 mr-2" />
          {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((item) => (
            <button key={item} className="px-2 py-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors hover:text-white cursor-pointer">
              {item}
            </button>
          ))}
        </div>

        {/* Center: Window Title */}
        <div className="text-[11px] font-medium tracking-tight text-zinc-400 absolute left-1/2 transform -translate-x-1/2">
          vscode clone - Antigravity
        </div>

        {/* Right: Window / Panel controls */}
        <div className="flex items-center gap-2 h-full">
          {/* Custom Panel Toggles */}
          <div className="flex items-center mr-2 border-r border-zinc-800 pr-2 gap-0.5">
            <button 
              onClick={() => setSidebarVisible(!sidebarVisible)} 
              title="Toggle Sidebar"
              className={`p-1 rounded transition-colors cursor-pointer ${sidebarVisible ? 'text-sky-500 bg-zinc-800/40' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
              {/* Left pane toggle icon representation */}
              <div className="w-3.5 h-3.5 border border-current rounded-[2px] flex">
                <div className="w-1 border-r border-current h-full" style={{ opacity: sidebarVisible ? 1 : 0.4 }} />
              </div>
            </button>
            <button 
              onClick={() => setTerminalVisible(!terminalVisible)} 
              title="Toggle Bottom Terminal"
              className={`p-1 rounded transition-colors cursor-pointer ${terminalVisible ? 'text-sky-500 bg-zinc-800/40' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
              {/* Bottom pane toggle representation */}
              <div className="w-3.5 h-3.5 border border-current rounded-[2px] flex flex-col justify-end">
                <div className="h-1 border-t border-current w-full" style={{ opacity: terminalVisible ? 1 : 0.4 }} />
              </div>
            </button>
            <button 
              onClick={() => setAgentVisible(!agentVisible)} 
              title="Toggle Gravity Agent"
              className={`p-1 rounded transition-colors cursor-pointer ${agentVisible ? 'text-sky-500 bg-zinc-800/40' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
              {/* Right pane toggle representation */}
              <div className="w-3.5 h-3.5 border border-current rounded-[2px] flex justify-end">
                <div className="w-1 border-l border-current h-full" style={{ opacity: agentVisible ? 1 : 0.4 }} />
              </div>
            </button>
          </div>

          {/* Profile Circle */}
          <div className="w-5 h-5 rounded-full bg-blue-600/90 text-white font-mono text-[9px] font-bold flex items-center justify-center mr-1 select-none">
            A
          </div>

          {/* Min/Max/Close window controls */}
          <div className="flex items-center gap-0.5 ml-1">
            <button className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all cursor-pointer">
              <Minus size={11} />
            </button>
            <button className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all cursor-pointer">
              <Square size={9} />
            </button>
            <button className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-all cursor-pointer">
              <X size={11} />
            </button>
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
          <div className="flex flex-col gap-2 items-center">
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
      <footer className="h-6 flex items-center justify-between px-3 select-none text-[11px] shrink-0 text-white"
        style={{ backgroundColor: '#007acc' }}>
        
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 hover:bg-[#1f8ad2] px-1.5 py-0.5 rounded cursor-pointer">
            <GitBranch size={11} />
            <span className="font-medium">main</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <span className="font-semibold">ⓧ</span>
              <span>0</span>
            </span>
            <span className="flex items-center gap-0.5">
              <span className="font-semibold">▲</span>
              <span>0</span>
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <span className="hover:underline cursor-pointer">Ln 1, Col 1</span>
          <span className="hover:underline cursor-pointer">Spaces: 4</span>
          <span className="hover:underline cursor-pointer">UTF-8</span>
          <div className="flex items-center gap-1 hover:bg-[#1f8ad2] px-1.5 py-0.5 rounded cursor-pointer">
            <span>Antigravity Workspace</span>
          </div>
          <Bell size={11} className="hover:text-zinc-200 cursor-pointer" />
        </div>
      </footer>
    </div>
  );
}
