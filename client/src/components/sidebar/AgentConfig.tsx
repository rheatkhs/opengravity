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
    <div className="h-full flex flex-col select-none text-[11px]" style={{
      paddingLeft: '12px',
      paddingRight: '12px'
    }}>
      <div className="flex items-center justify-between h-9 px-4 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Agent Config</span>
      </div>
      <div className="flex-1" style={{
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Provider */}
        <div>
          <label style={labelStyle}>Provider</label>
          <div className="relative w-full">
            <select value={provider} onChange={(e) => { setProvider(e.target.value as AgentProvider); setModel(PROVIDER_MODELS[e.target.value as AgentProvider][0]); }}
              className="appearance-none cursor-pointer" style={{ ...inputStyle, paddingRight: '28px' }}>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="custom">Custom Provider</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {/* API Key */}
        {provider !== 'ollama' && (
          <div>
            <label style={labelStyle}>API Key</label>
            <div className="relative">
              <Key size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dimmed)' }} />
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openrouter' ? 'sk-or-...' : provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                className="font-mono" style={{ ...inputStyle, paddingLeft: '28px', paddingRight: '48px' }} />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] cursor-pointer"
                style={{ color: 'var(--color-text-muted)', border: 'none', background: 'none' }}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
          </div>
        )}

        {/* Base URL for Ollama and Custom */}
        {(provider === 'ollama' || provider === 'custom') && (
          <div>
            <label style={labelStyle}>Base URL</label>
            <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:8000/v1'}
              className="font-mono" style={inputStyle} />
          </div>
        )}

        {/* Model */}
        <div>
          <label style={labelStyle}>Model</label>
          <div className="relative">
            {provider === 'custom' ? (
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. mistral-medium"
                className="font-mono" style={inputStyle} />
            ) : (
              <select value={model} onChange={(e) => setModel(e.target.value)} className="appearance-none cursor-pointer font-mono" style={{ ...inputStyle, paddingRight: '28px' }}>
                {PROVIDER_MODELS[provider].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {provider !== 'custom' && (
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
        </div>

        {/* Status */}
        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, backgroundColor: apiKey || provider === 'ollama' || provider === 'custom' ? 'var(--color-success)' : 'var(--color-text-dimmed)' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>
              {apiKey || provider === 'ollama' || provider === 'custom' ? 'Ready' : 'Enter API key to start'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
