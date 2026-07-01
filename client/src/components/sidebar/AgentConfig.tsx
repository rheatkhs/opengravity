import { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Link, Globe } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { PROVIDER_MODELS, type AgentProvider } from '../../types/agent';
import { testProviderConnection } from '../../agent/agent-loop';

export default function AgentConfig() {
  const { provider, apiKey, model, baseUrl, setProvider, setApiKey, setModel, setBaseUrl } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);

  // Connection testing states
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  // Reset connection test status when configuration changes
  useEffect(() => {
    setTestStatus('idle');
    setTestError(null);
  }, [provider, apiKey, model, baseUrl]);

  // Dynamic OpenRouter models list
  const [openrouterModels, setOpenrouterModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch OpenRouter models list dynamically
  useEffect(() => {
    if (provider !== 'openrouter') return;
    if (openrouterModels.length > 0) return;

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
          // Sort alphabetically by name
          modelsList.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setOpenrouterModels(modelsList);

          // If current model is default placeholder, set it to the first fetched model if appropriate
          // But usually we preserve the selected model.
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

  // Dropdown open, search query, and hover states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // When provider changes, close dropdown and reset search
  useEffect(() => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    setHoveredIndex(null);
  }, [provider]);

  // Provider dropdown states
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [hoveredProviderIndex, setHoveredProviderIndex] = useState<number | null>(null);

  const PROVIDERS_LIST: { id: AgentProvider; name: string }[] = [
    { id: 'anthropic', name: 'Anthropic (Claude)' },
    { id: 'openai', name: 'OpenAI (GPT)' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'ollama', name: 'Ollama (Local LLM)' },
    { id: 'custom', name: 'Custom OpenAI Compatible' }
  ];

  const getProviderDisplayName = (p: AgentProvider) => {
    const found = PROVIDERS_LIST.find(item => item.id === p);
    return found ? found.name : p;
  };

  // Determine current display name
  const getModelDisplayName = (modelId: string) => {
    if (provider === 'openrouter') {
      const found = openrouterModels.find(m => m.id === modelId);
      return found ? found.name : modelId;
    }
    return modelId;
  };

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
      return PROVIDER_MODELS[provider].map(m => ({ id: m, name: m }));
    }
  };

  const allAvailableModels = getModelsList();

  const filteredModels = allAvailableModels.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError(null);
    try {
      const result = await testProviderConnection(provider, apiKey, model, baseUrl);
      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
        setTestError(result.message);
      }
    } catch (e) {
      setTestStatus('failed');
      setTestError(e instanceof Error ? e.message : String(e));
    }
  };

  const inputStyle = {
    width: '100%',
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '10px',
    paddingRight: '10px',
    fontSize: '13px',
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-default)',
    color: 'var(--color-text-primary)',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '6px',
    color: 'var(--color-text-secondary)',
  };

  const sectionContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    padding: '16px 14px',
    backgroundColor: 'var(--color-bg-deep)',
    borderRadius: '6px',
    border: '1px solid var(--color-border-subtle)',
    marginBottom: '14px',
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      backgroundColor: 'var(--color-bg-base)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '38px',
        paddingLeft: '16px',
        paddingRight: '8px',
        flexShrink: 0,
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-deep)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>Agent Configuration</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {/* Core Config Section */}
        <div style={sectionContainerStyle}>
          {/* Provider */}
          <div>
            <label style={labelStyle}>AI Provider</label>
            <div style={{ position: 'relative' }}>
              <Globe
                size={12}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-dimmed)',
                  zIndex: 2,
                }}
              />
              <div style={{ position: 'relative' }}>
                {/* Select Trigger */}
                <div
                  onClick={() => {
                    setIsProviderDropdownOpen(!isProviderDropdownOpen);
                    setHoveredProviderIndex(null);
                  }}
                  style={{
                    ...inputStyle,
                    paddingLeft: '28px',
                    paddingRight: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    height: '37px', // Match standard select height
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
                  onMouseLeave={(e) => {
                    if (!isProviderDropdownOpen) {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-primary)',
                    flex: 1,
                    textAlign: 'left',
                  }}>
                    {getProviderDisplayName(provider)}
                  </span>
                </div>

                {/* Backdrop for click-away */}
                {isProviderDropdownOpen && (
                  <div
                    onClick={() => setIsProviderDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999,
                      backgroundColor: 'transparent',
                    }}
                  />
                )}

                {/* Dropdown Options Panel */}
                {isProviderDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-active)',
                    borderRadius: '4px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '4px 0',
                    }}>
                      {PROVIDERS_LIST.map((item, idx) => {
                        const isSelected = item.id === provider;
                        const isHovered = hoveredProviderIndex === idx;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setProvider(item.id);
                              setModel(PROVIDER_MODELS[item.id][0]);
                              setIsProviderDropdownOpen(false);
                            }}
                            onMouseEnter={() => setHoveredProviderIndex(idx)}
                            onMouseLeave={() => setHoveredProviderIndex(null)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontFamily: 'var(--font-sans)',
                              cursor: 'pointer',
                              backgroundColor: isSelected
                                ? 'var(--color-accent-muted)'
                                : isHovered
                                  ? 'var(--color-bg-hover)'
                                  : 'transparent',
                              color: isSelected
                                ? '#ffffff'
                                : isHovered
                                  ? 'var(--color-text-primary)'
                                  : 'var(--color-text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'left',
                              transition: 'background-color 0.1s, color 0.1s',
                            }}
                          >
                            {item.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Base URL for Ollama and Custom */}
          {(provider === 'ollama' || provider === 'custom') && (
            <div>
              <label style={labelStyle}>Base URL Endpoint</label>
              <div style={{ position: 'relative' }}>
                <Link
                  size={12}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-dimmed)',
                  }}
                />
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:8000/v1'}
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--font-mono)',
                    paddingLeft: '28px',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                />
              </div>
            </div>
          )}

          {/* API Key */}
          {provider !== 'ollama' && (
            <div>
              <label style={labelStyle}>API Credentials Key</label>
              <div style={{ position: 'relative' }}>
                <Key
                  size={12}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-dimmed)',
                  }}
                />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'openrouter' ? 'sk-or-...' : provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--font-mono)',
                    paddingLeft: '28px',
                    paddingRight: '48px',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--color-accent-primary)',
                    border: 'none',
                    background: 'none',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent-primary)'}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Model */}
          <div>
            <label style={labelStyle}>LLM Model Version</label>
            <div style={{ position: 'relative' }}>
              <Cpu
                size={12}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-dimmed)',
                  zIndex: 2,
                }}
              />
              {provider === 'custom' ? (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. mistral-medium"
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--font-mono)',
                    paddingLeft: '28px',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                />
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Select Trigger */}
                  <div
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      setSearchQuery('');
                      setHoveredIndex(null);
                    }}
                    style={{
                      ...inputStyle,
                      paddingLeft: '28px',
                      paddingRight: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none',
                      height: '37px', // Match standard select height
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
                    onMouseLeave={(e) => {
                      if (!isDropdownOpen) {
                        e.currentTarget.style.borderColor = 'var(--color-border-default)';
                      }
                    }}
                  >
                    <span style={{
                      fontFamily: provider === 'openrouter' ? 'var(--font-sans)' : 'var(--font-mono)',
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-text-primary)',
                      flex: 1,
                      textAlign: 'left',
                    }}>
                      {getModelDisplayName(model)}
                    </span>
                  </div>

                  {/* Backdrop for click-away */}
                  {isDropdownOpen && (
                    <div
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                        backgroundColor: 'transparent',
                      }}
                    />
                  )}

                  {/* Dropdown Options Panel */}
                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-active)',
                      borderRadius: '4px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: '260px',
                      overflow: 'hidden',
                    }}>
                      {/* Search Bar */}
                      <div style={{
                        padding: '6px',
                        borderBottom: '1px solid var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-deep)',
                      }}>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search models..."
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                            borderRadius: '3px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-primary)'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                        />
                      </div>

                      {/* Scrollable list */}
                      <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '4px 0',
                      }}>
                        {filteredModels.length === 0 ? (
                          <div style={{
                            padding: '10px 12px',
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                            textAlign: 'center',
                          }}>
                            No models found
                          </div>
                        ) : (
                          filteredModels.map((m, idx) => {
                            const isSelected = m.id === model;
                            const isHovered = hoveredIndex === idx;
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setModel(m.id);
                                  setIsDropdownOpen(false);
                                }}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontFamily: provider === 'openrouter' ? 'var(--font-sans)' : 'var(--font-mono)',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected
                                    ? 'var(--color-accent-muted)'
                                    : isHovered
                                      ? 'var(--color-bg-hover)'
                                      : 'transparent',
                                  color: isSelected
                                    ? '#ffffff'
                                    : isHovered
                                      ? 'var(--color-text-primary)'
                                      : 'var(--color-text-secondary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textAlign: 'left',
                                  transition: 'background-color 0.1s, color 0.1s',
                                }}
                              >
                                {m.name}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Tester Section */}
        <div style={{
          ...sectionContainerStyle,
          border: testStatus === 'success'
            ? '1px solid var(--color-success)'
            : testStatus === 'failed'
              ? '1px solid var(--color-error)'
              : '1px solid var(--color-border-subtle)',
          transition: 'border-color 0.2s ease',
        }}>
          <label style={labelStyle}>Connectivity Verification</label>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            style={{
              width: '100%',
              paddingTop: '8px',
              paddingBottom: '8px',
              backgroundColor: testStatus === 'testing'
                ? 'var(--color-bg-surface)'
                : testStatus === 'success'
                  ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                  : testStatus === 'failed'
                    ? 'color-mix(in srgb, var(--color-error) 10%, transparent)'
                    : 'var(--color-bg-elevated)',
              border: testStatus === 'success'
                ? '1px solid var(--color-success)'
                : testStatus === 'failed'
                  ? '1px solid var(--color-error)'
                  : '1px solid var(--color-border-default)',
              color: testStatus === 'success'
                ? 'var(--color-success)'
                : testStatus === 'failed'
                  ? 'var(--color-error)'
                  : 'var(--color-text-primary)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (testStatus === 'testing') return;
              e.currentTarget.style.backgroundColor = testStatus === 'success'
                ? 'color-mix(in srgb, var(--color-success) 18%, transparent)'
                : testStatus === 'failed'
                  ? 'color-mix(in srgb, var(--color-error) 18%, transparent)'
                  : 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (testStatus === 'testing') return;
              e.currentTarget.style.backgroundColor = testStatus === 'success'
                ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                : testStatus === 'failed'
                  ? 'color-mix(in srgb, var(--color-error) 10%, transparent)'
                  : 'var(--color-bg-elevated)';
            }}
          >
            {testStatus === 'testing' && (
              <RefreshCw size={12} className="animate-spin" />
            )}
            {testStatus === 'testing' && 'Testing Connection...'}
            {testStatus === 'success' && 'Connection Successful ✓'}
            {testStatus === 'failed' && 'Connection Failed ✗'}
            {testStatus === 'idle' && 'Test Connection'}
          </button>

          {/* Test Error Display */}
          {testStatus === 'failed' && testError && (
            <div style={{
              fontSize: '11px',
              color: 'var(--color-error)',
              backgroundColor: 'color-mix(in srgb, var(--color-error) 5%, transparent)',
              padding: '8px 10px',
              borderRadius: '4px',
              border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
              fontFamily: 'var(--font-mono)',
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', fontWeight: 600, alignItems: 'center' }}>
                <AlertTriangle size={12} />
                <span>Error details:</span>
              </div>
              {testError}
            </div>
          )}

          {/* Test Success Details */}
          {testStatus === 'success' && (
            <div style={{
              fontSize: '11px',
              color: 'var(--color-success)',
              backgroundColor: 'color-mix(in srgb, var(--color-success) 5%, transparent)',
              padding: '8px 10px',
              borderRadius: '4px',
              border: '1px solid color-mix(in srgb, var(--color-success) 20%, transparent)',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}>
              <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>Connected.</strong> The agent is ready to process requests using {model}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

