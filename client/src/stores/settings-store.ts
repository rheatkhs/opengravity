import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentProvider } from '../types/agent';

interface SettingsStore {
  provider: AgentProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  maxSteps: number;
  commandBudget: number;
  daemonUrl: string;

  setProvider: (provider: AgentProvider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setMaxSteps: (steps: number) => void;
  setCommandBudget: (budget: number) => void;
  setDaemonUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      provider: 'anthropic',
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
      baseUrl: 'http://localhost:11434',
      maxSteps: 50,
      commandBudget: 5,
      daemonUrl: 'ws://127.0.0.1:9800',

      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setMaxSteps: (maxSteps) => set({ maxSteps }),
      setCommandBudget: (commandBudget) => set({ commandBudget }),
      setDaemonUrl: (daemonUrl) => set({ daemonUrl }),
    }),
    {
      name: 'opengravity-settings',
    }
  )
);
