import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Code2, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from 'lucide-react';
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

  const [zoom, setZoom] = useState(100);
  const [imgDetails, setImgDetails] = useState<{ width: number; height: number } | null>(null);

  // Reset zoom & details when tab changes
  useEffect(() => {
    setZoom(100);
    setImgDetails(null);
  }, [activeTab?.id]);

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

  const isImageTab = activeTab && (
    activeTab.content.startsWith('data:image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg'].includes(activeTab.name.split('.').pop()?.toLowerCase() || '')
  );

  if (isImageTab && activeTab) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--color-bg-deep)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Top Control Bar */}
        <div style={{
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg-surface)',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            <ImageIcon size={14} style={{ color: 'var(--color-accent-primary)' }} />
            <span>{activeTab.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setZoom(Math.max(10, zoom - 10))}
              title="Zoom Out"
              className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-dimmed)'
              }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', minWidth: '36px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(500, zoom + 10))}
              title="Zoom In"
              className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-dimmed)'
              }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(100)}
              title="Reset Zoom"
              className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-dimmed)'
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Center Canvas Area with Checkered transparency background */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '24px',
          backgroundImage: 'conic-gradient(rgba(255, 255, 255, 0.03) 25%, transparent 25% 50%, rgba(255, 255, 255, 0.03) 50% 75%, transparent 75%)',
          backgroundSize: '16px 16px',
          backgroundColor: 'var(--color-bg-deep)'
        }}>
          <img
            src={activeTab.content}
            alt={activeTab.name}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgDetails({
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            }}
            style={{
              maxWidth: 'none',
              maxHeight: 'none',
              width: `${zoom}%`,
              height: 'auto',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              transition: 'width 0.15s ease-out, transform 0.15s ease-out',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--color-border-subtle)'
            }}
          />
        </div>

        {/* Footer Meta Bar */}
        {imgDetails && (
          <div style={{
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontSize: '9.5px',
            fontFamily: 'monospace',
            backgroundColor: 'var(--color-bg-surface)',
            borderTop: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
            userSelect: 'none'
          }}>
            <span>Dimensions: {imgDetails.width} × {imgDetails.height} px</span>
          </div>
        )}
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
