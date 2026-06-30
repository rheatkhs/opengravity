import { create } from 'zustand';
import type { AgentStatus, ThoughtEntry, ToolCallEntry } from '../types/agent';

interface AgentStore {
  status: AgentStatus;
  objective: string;
  currentStep: number;
  maxSteps: number;
  consecutiveCommands: number;
  commandBudget: number;
  thoughts: ThoughtEntry[];
  toolCalls: ToolCallEntry[];
  error: string | null;

  setStatus: (status: AgentStatus) => void;
  setObjective: (objective: string) => void;
  incrementStep: () => void;
  incrementConsecutiveCommands: () => void;
  resetConsecutiveCommands: () => void;
  addThought: (thought: ThoughtEntry) => void;
  addToolCall: (toolCall: ToolCallEntry) => void;
  updateToolCall: (id: string, update: Partial<ToolCallEntry>) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as AgentStatus,
  objective: '',
  currentStep: 0,
  maxSteps: 50,
  consecutiveCommands: 0,
  commandBudget: 5,
  thoughts: [] as ThoughtEntry[],
  toolCalls: [] as ToolCallEntry[],
  error: null as string | null,
};

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setObjective: (objective) => set({ objective }),
  incrementStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  incrementConsecutiveCommands: () => set((s) => ({ consecutiveCommands: s.consecutiveCommands + 1 })),
  resetConsecutiveCommands: () => set({ consecutiveCommands: 0 }),
  addThought: (thought) => set((s) => ({ thoughts: [...s.thoughts, thought] })),
  addToolCall: (toolCall) => set((s) => ({ toolCalls: [...s.toolCalls, toolCall] })),
  updateToolCall: (id, update) =>
    set((s) => ({
      toolCalls: s.toolCalls.map((tc) => (tc.id === id ? { ...tc, ...update } : tc)),
    })),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
