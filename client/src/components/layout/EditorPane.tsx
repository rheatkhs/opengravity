import EditorTabs from '../editor/EditorTabs';
import CodeEditor from '../editor/CodeEditor';

export default function EditorPane() {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <EditorTabs />
      <div className="flex-1 overflow-hidden">
        <CodeEditor />
      </div>
    </div>
  );
}
