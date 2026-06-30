import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput, foldGutter, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { Cloud } from 'lucide-react';
import { useEditorStore } from '../../stores/editor-store';
import { writeFile } from '../../lib/fs-access';

function getLanguageExtension(lang: string): Extension | null {
  switch (lang) {
    case 'typescript': return javascript({ typescript: true, jsx: true });
    case 'javascript': return javascript({ jsx: true });
    case 'html': return html();
    case 'css': return css();
    case 'json': return json();
    case 'python': return python();
    case 'markdown': return markdown();
    default: return null;
  }
}

export default function CodeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const activeTab = useEditorStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab;
  });
  const updateContent = useEditorStore((s) => s.updateContent);
  const markClean = useEditorStore((s) => s.markClean);

  // Debounced auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    try {
      await writeFile(activeTab.handle, activeTab.content);
      markClean(activeTab.id);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [activeTab, markClean]);

  useEffect(() => {
    if (!containerRef.current || !activeTab) return;

    // Destroy previous editor
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      drawSelection(),
      rectangularSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      oneDark,
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            handleSave();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString();
          updateContent(activeTab.id, content);

          // Debounced auto-save (2s)
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            handleSave();
          }, 2000);
        }
      }),
      EditorView.theme({
        '&': {
          backgroundColor: '#0a0a0f',
        },
        '.cm-content': {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          lineHeight: '1.6',
        },
        '.cm-line': {
          padding: '0 4px',
        },
      }),
    ];

    // Add language extension
    const langExt = getLanguageExtension(activeTab.language);
    if (langExt) extensions.push(langExt);

    const state = EditorState.create({
      doc: activeTab.content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activeTab?.id]); // Only recreate on tab switch, not on every content change

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div className="text-center animate-fade-in flex flex-col items-center">
          <div className="mb-4 p-3 rounded-full opacity-20" style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}>
            <Cloud size={32} style={{ color: 'var(--color-accent-primary)' }} />
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium">Open a file to start editing</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-1.5 max-w-[240px] leading-relaxed">
            Use the file explorer in the left sidebar to open or browse files in your local workspace.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
}
