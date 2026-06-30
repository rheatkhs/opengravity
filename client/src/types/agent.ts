/** Agent state and event types */

export type AgentProvider = 'anthropic' | 'openai' | 'ollama';

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
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'claude-3-5-haiku-20241022',
  ],
  openai: [
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'o3',
    'o4-mini',
  ],
  ollama: [
    'llama3.3:latest',
    'qwen3:latest',
    'deepseek-r1:latest',
    'codestral:latest',
  ],
};
