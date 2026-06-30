import { Panel, Group, Separator } from 'react-resizable-panels';
import { Cloud } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import EditorPane from './components/layout/EditorPane';
import TerminalPane from './components/layout/TerminalPane';
import AgentPanel from './components/layout/AgentPanel';

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-deep)' }}>
      {/* Status Bar */}
      <header className="flex items-center justify-between px-3 h-8 shrink-0 select-none"
        style={{ backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Cloud size={14} style={{ color: 'var(--color-accent-primary)' }} />
          <span className="text-[11px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            OpenGravity
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dimmed)' }}>v0.1.0</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--color-success)' }} />
            <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>daemon:9800</span>
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <Group orientation="horizontal" className="flex-1">
        {/* Left: Sidebar */}
        <Panel defaultSize={15} minSize={10} maxSize={25}>
          <Sidebar />
        </Panel>
        <Separator />

        {/* Center: Editor + Terminal */}
        <Panel defaultSize={60} minSize={30}>
          <Group orientation="vertical">
            {/* Editor */}
            <Panel defaultSize={65} minSize={20}>
              <EditorPane />
            </Panel>
            <Separator />

            {/* Terminal */}
            <Panel defaultSize={35} minSize={10} collapsible>
              <TerminalPane />
            </Panel>
          </Group>
        </Panel>
        <Separator />

        {/* Right: Agent Panel */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <AgentPanel />
        </Panel>
      </Group>
    </div>
  );
}
