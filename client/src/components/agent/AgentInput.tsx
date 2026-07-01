import { useState, useEffect } from 'react';
import {
  Square,
  Send,
  ShieldAlert,
  Check,
  Plus,
  Mic,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import type { AgentStatus } from '../../types/agent';
import { PROVIDER_MODELS } from '../../types/agent';
import { useSettingsStore } from '../../stores/settings-store';

interface AgentInputProps {
  status: AgentStatus;
  consecutiveCommands: number;
  resumeHandler: (() => void) | null;
  onSubmitObjective: (objective: string) => void;
  onStopAgent: () => void;
}

export function AgentInput({
  status,
  consecutiveCommands,
  resumeHandler,
  onSubmitObjective,
  onStopAgent
}: AgentInputProps) {
  const [input, setInput] = useState('');
  const { provider, model, setModel } = useSettingsStore();

  const [openrouterModels, setOpenrouterModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch OpenRouter models dynamically when provider changes
  useEffect(() => {
    if (provider !== 'openrouter' || openrouterModels.length > 0) return;

    let active = true;
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const res = await fetch('https://openrouter.ai/api/v1/models');
        if (!res.ok) throw new Error('Failed to fetch OpenRouter models');
        const json = await res.json();
        if (json && Array.isArray(json.data) && active) {
          const modelsList = json.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
          }));
          modelsList.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setOpenrouterModels(modelsList);
        }
      } catch (err) {
        console.error('Error fetching OpenRouter models:', err);
      } finally {
        if (active) setIsLoadingModels(false);
      }
    };

    fetchModels();
    return () => {
      active = false;
    };
  }, [provider, openrouterModels.length]);

  const getModelsList = () => {
    if (provider === 'openrouter') {
      if (isLoadingModels && openrouterModels.length === 0) {
        return [{ id: model, name: `${model} (Loading...)` }];
      }
      const list = [...openrouterModels];
      if (model && !list.some(m => m.id === model)) {
        list.unshift({ id: model, name: model });
      }
      return list;
    } else {
      const list = PROVIDER_MODELS[provider] || [];
      return list.map(m => ({ id: m, name: m }));
    }
  };

  const filteredModels = getModelsList().filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!input.trim() || status === 'running' || status === 'paused') return;
    onSubmitObjective(input.trim());
    setInput('');
  };

  return (
    <div style={{
      padding: '12px',
      flexShrink: 0,
      borderTop: '1px solid var(--color-border-subtle)',
      backgroundColor: 'var(--color-bg-surface)'
    }}>
      {status === 'paused' && resumeHandler ? (
        <div className="animate-fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid rgba(230, 140, 10, 0.3)',
          backgroundColor: 'rgba(230, 140, 10, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)' }}>
            <ShieldAlert size={14} />
            <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>Safety Halt Triggered</span>
          </div>
          <p style={{ fontSize: '10px', lineHeight: '1.5', color: 'var(--color-text-secondary)', margin: 0 }}>
            The agent has run {consecutiveCommands} consecutive commands. Click approve to authorize the next commands.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <button onClick={() => resumeHandler()} className="hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                paddingTop: '4px',
                paddingBottom: '4px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: 'var(--color-accent-primary)',
                border: 'none'
              }}>
              <Check size={12} /> Approve & Resume
            </button>
            <button onClick={onStopAgent} className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                paddingTop: '4px',
                paddingBottom: '4px',
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-default)'
              }}>
              Abort
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--color-border-default)',
          borderRadius: '6px',
          backgroundColor: 'var(--color-bg-deep)',
          padding: '8px',
          gap: '8px',
          position: 'relative'
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={status === 'running'}
            placeholder={status === 'running' ? "Agent processing..." : "Ask anything..."}
            rows={2}
            style={{
              width: '100%',
              fontSize: '12px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              lineHeight: '1.5',
              fontFamily: 'var(--font-sans)'
            }}
          />

          {/* Sub-toolbar inside the input container */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
            {/* Left tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }}>
                <Plus size={13} />
              </button>
              {/* Fast speed pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                paddingLeft: '5px',
                paddingRight: '5px',
                paddingTop: '1px',
                paddingBottom: '1px',
                borderRadius: '3px',
                backgroundColor: 'var(--color-bg-hover)',
                color: 'var(--color-text-secondary)',
                fontSize: '8px',
                fontWeight: '600',
                border: '1px solid var(--color-border-subtle)'
              }}>
                <Sparkles size={8} style={{ color: 'var(--color-text-muted)' }} />
                <span>Fast</span>
              </div>
              {/* Model dropdown */}
              <div style={{ position: 'relative' }}>
                <div className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setSearchQuery('');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>
                  <span>{model}</span>
                  <ChevronDown size={8} />
                </div>

                {isDropdownOpen && (
                  <>
                    {/* Backdrop for click-away */}
                    <div
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9998,
                      }}
                    />
                    {/* Dropdown Menu */}
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                      width: '220px',
                      maxHeight: '200px',
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      zIndex: 9999,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}>
                      {/* Search Input */}
                      <div style={{
                        padding: '4px',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: 'var(--color-bg-deep)',
                      }}>
                        <input
                          type="text"
                          placeholder="Search models..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '3px 6px',
                            fontSize: '10px',
                            backgroundColor: 'var(--color-bg-surface)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: '3px',
                            outline: 'none',
                          }}
                        />
                      </div>
                      {/* List Items */}
                      <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '2px 0',
                      }}>
                        {filteredModels.length === 0 ? (
                          <div style={{
                            padding: '6px 8px',
                            fontSize: '10px',
                            color: 'var(--color-text-dimmed)',
                            textAlign: 'center',
                          }}>
                            No models found
                          </div>
                        ) : (
                          filteredModels.map((m) => {
                            const isSelected = m.id === model;
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setModel(m.id);
                                  setIsDropdownOpen(false);
                                }}
                                style={{
                                  padding: '5px 8px',
                                  fontSize: '10px',
                                  color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.1s',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                                  e.currentTarget.style.color = 'var(--color-text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isSelected ? 'rgba(255, 255, 255, 0.04)' : 'transparent';
                                  e.currentTarget.style.color = isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)';
                                }}
                              >
                                <div style={{ fontWeight: isSelected ? '600' : 'normal', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.name}</div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button className="hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', borderRadius: '3px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-dimmed)' }}>
                <Mic size={13} />
              </button>
              {status === 'running' ? (
                <button onClick={onStopAgent} title="Abort Mission" className="hover:bg-red-500 transition-colors cursor-pointer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '3px', border: 'none', backgroundColor: 'var(--color-error)', color: 'white' }}>
                  <Square size={11} fill="currentColor" />
                </button>
              ) : (
                <button onClick={handleSubmit} title="Send Message"
                  disabled={!input.trim()}
                  className="transition-colors cursor-pointer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: input.trim() ? 'var(--color-accent-primary)' : 'transparent',
                    color: input.trim() ? 'white' : 'var(--color-text-dimmed)'
                  }}>
                  <Send size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
