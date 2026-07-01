import { useState } from 'react';
import { Key, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { PROVIDER_MODELS, type AgentProvider } from '../../types/agent';

export default function AgentConfig() {
  const { provider, apiKey, model, baseUrl, setProvider, setApiKey, setModel, setBaseUrl } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);

  const inputStyle = {
    width: '100%',
    paddingTop: '6px',
    paddingBottom: '6px',
    paddingLeft: '10px',
    paddingRight: '10px',
    fontSize: '12px',
    backgroundColor: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border-default)',
    color: 'var(--color-text-primary)',
    borderRadius: '3px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '6px',
    color: 'var(--color-text-muted)'
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '34px',
        paddingLeft: '16px',
        paddingRight: '8px',
        flexShrink: 0,
        borderBottom: '1px solid color-mix(in srgb, var(--color-border-subtle) 30%, transparent)'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-text-muted, #6b7280)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>Agent Config</span>
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Provider */}
        <div>
          <label style={labelStyle}>Provider</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as AgentProvider);
                setModel(PROVIDER_MODELS[e.target.value as AgentProvider][0]);
              }}
              style={{
                ...inputStyle,
                paddingRight: '28px',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="custom">Custom Provider</option>
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--color-text-muted)'
              }}
            />
          </div>
        </div>

        {/* API Key */}
        {provider !== 'ollama' && (
          <div>
            <label style={labelStyle}>API Key</label>
            <div style={{ position: 'relative' }}>
              <Key
                size={12}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-dimmed)'
                }}
              />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openrouter' ? 'sk-or-...' : provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  paddingLeft: '28px',
                  paddingRight: '48px'
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  border: 'none',
                  background: 'none'
                }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        )}

        {/* Base URL for Ollama and Custom */}
        {(provider === 'ollama' || provider === 'custom') && (
          <div>
            <label style={labelStyle}>Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:8000/v1'}
              style={{
                ...inputStyle,
                fontFamily: 'monospace'
              }}
            />
          </div>
        )}

        {/* Model */}
        <div>
          <label style={labelStyle}>Model</label>
          <div style={{ position: 'relative' }}>
            {provider === 'custom' ? (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. mistral-medium"
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace'
                }}
              />
            ) : (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  paddingRight: '28px',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              >
                {PROVIDER_MODELS[provider].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            {provider !== 'custom' && (
              <ChevronDown
                size={12}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--color-text-muted)'
                }}
              />
            )}
          </div>
        </div>

        {/* Status */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: apiKey || provider === 'ollama' || provider === 'custom' ? 'var(--color-success)' : 'var(--color-text-dimmed)'
            }} />
            <span style={{ color: 'var(--color-text-muted)' }}>
              {apiKey || provider === 'ollama' || provider === 'custom' ? 'Ready' : 'Enter API key to start'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

