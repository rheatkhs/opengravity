import { useState } from 'react';
import { Key, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { PROVIDER_MODELS, type AgentProvider } from '../../types/agent';

export default function AgentConfig() {
  const { provider, apiKey, model, baseUrl, setProvider, setApiKey, setModel, setBaseUrl } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);

  const inputStyle = {
    backgroundColor: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border-default)',
    color: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-md)',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Agent Config
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Provider */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Provider</label>
          <div className="relative">
            <select value={provider} onChange={(e) => { setProvider(e.target.value as AgentProvider); setModel(PROVIDER_MODELS[e.target.value as AgentProvider][0]); }}
              className="w-full px-2.5 py-1.5 text-xs appearance-none pr-7" style={inputStyle}>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {/* API Key */}
        {provider !== 'ollama' && (
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>API Key</label>
            <div className="relative">
              <Key size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dimmed)' }} />
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder={`${provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}`}
                className="w-full pl-7 pr-12 py-1.5 text-xs font-mono" style={inputStyle} />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
                style={{ color: 'var(--color-text-muted)' }}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
          </div>
        )}

        {/* Base URL for Ollama */}
        {provider === 'ollama' && (
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Base URL</label>
            <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono" style={inputStyle} />
          </div>
        )}

        {/* Model */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Model</label>
          <div className="relative">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-2.5 py-1.5 text-xs appearance-none pr-7 font-mono" style={inputStyle}>
              {PROVIDER_MODELS[provider].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {/* Status */}
        <div className="pt-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: apiKey || provider === 'ollama' ? 'var(--color-success)' : 'var(--color-text-dimmed)' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>
              {apiKey || provider === 'ollama' ? 'Ready' : 'Enter API key to start'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
