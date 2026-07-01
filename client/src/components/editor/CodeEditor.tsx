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
import { Code2 } from 'lucide-react';
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
  const wordWrap = useEditorStore((s) => s.wordWrap);

  // Sync activeTab to ref to prevent stale closure bugs
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Debounced auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(async () => {
    const tab = activeTabRef.current;
    if (!tab || !viewRef.current) return;
    try {
      const content = viewRef.current.state.doc.toString();
      await writeFile(tab.handle, content);
      markClean(tab.id);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [markClean]);

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
          const tab = activeTabRef.current;
          if (tab) {
            updateContent(tab.id, content);
          }

          // Debounced auto-save (2s)
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            handleSave();
          }, 2000);
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          backgroundColor: 'var(--color-bg-deep)',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
        },
        '.cm-content': {
          fontSize: '13px',
          lineHeight: '1.6',
          padding: '8px 0',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--color-bg-deep)',
          borderRight: '1px solid var(--color-border-subtle)',
          color: '#52525b',
        },
        '.cm-gutterElement': {
          padding: '0 8px 0 12px',
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          color: '#a1a1aa',
        },
        '.cm-line': {
          padding: '0 12px',
        },
      }),
    ];

    // Add language extension
    const langExt = getLanguageExtension(activeTab.language);
    if (langExt) extensions.push(langExt);

    // Add word wrap extension if active
    if (wordWrap) {
      extensions.push(EditorView.lineWrapping);
    }

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
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [activeTab?.id, wordWrap]); // Only recreate on tab switch, not on every content change

  if (!activeTab) {
    return (
      <div
        key="editor-empty-placeholder"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'radial-gradient(circle at center, var(--color-bg-surface) 0%, var(--color-bg-base) 100%)',
          userSelect: 'none'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.12)',
            marginBottom: '20px'
          }}>
            <Code2 size={24} style={{ color: 'var(--color-accent-primary)' }} />
          </div>
          <p style={{
            color: 'var(--color-text-primary)',
            fontSize: '13.5px',
            fontWeight: 600,
            letterSpacing: '-0.01em'
          }}>Open a file to start editing</p>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '11.5px',
            marginTop: '8px',
            maxWidth: '280px',
            lineHeight: '1.6'
          }}>
            Select a file from the explorer sidebar, or use the quick access shortcuts below.
          </p>

          <div style={{
            marginTop: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            width: '260px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Search Files</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <kbd style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', padding: '2px 5px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>Ctrl</kbd>
                <kbd style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', padding: '2px 5px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>P</kbd>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Show Explorer</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <kbd style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', padding: '2px 5px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>Ctrl</kbd>
                <kbd style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', padding: '2px 5px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>B</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key="editor-active-container"
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-deep)',
      }}
    />
  );
}
