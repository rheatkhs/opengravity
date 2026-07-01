/** Agent state and event types */

export type AgentProvider = 'anthropic' | 'openai' | 'ollama' | 'openrouter' | 'custom';

export interface AgentConfig {
  provider: AgentProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  maxSteps: number;
  commandBudget: number;
}

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'complete';

export interface AgentState {
  status: AgentStatus;
  objective: string;
  currentStep: number;
  maxSteps: number;
  consecutiveCommands: number;
  commandBudget: number;
  thoughts: ThoughtEntry[];
  toolCalls: ToolCallEntry[];
  error?: string;
}

export interface ThoughtEntry {
  id: string;
  timestamp: number;
  content: string;
  type: 'reasoning' | 'plan' | 'observation' | 'error';
}

export interface ToolCallEntry {
  id: string;
  timestamp: number;
  toolName: string;
  args: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  duration?: number;
}

export const PROVIDER_MODELS: Record<AgentProvider, string[]> = {
  anthropic: [
    'claude-fable-5',
    'claude-mythos-5',
    'claude-sonnet-5',
    'claude-haiku-4.5',
    'claude-opus-4.8',
    'claude-3-5-sonnet-latest',
  ],
  openai: [
    'gpt-5.6-sol',
    'gpt-5.6-terra',
    'gpt-5.6-luna',
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o3-mini',
  ],
  ollama: [
    'deepseek-r1:latest',
    'llama3.3:latest',
    'qwen2.5-coder:latest',
    'mistral:latest',
  ],
  openrouter: [
    'deepseek/deepseek-r1',
    'anthropic/claude-fable-5',
    'anthropic/claude-sonnet-5',
    'openai/gpt-5.6-sol',
    'openai/gpt-5.6-terra',
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash',
    'meta-llama/llama-3.3-70b-instruct',
  ],
  custom: [
    'custom-model',
  ],
};
