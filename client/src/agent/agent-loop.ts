/**
 * Main autonomous agent execution loop.
 * Uses Vercel AI SDK streamText with a manual tool-calling loop.
 * Emits events for UI updates (thoughts, tool calls, errors).
 */

import { streamText, type ModelMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createTools } from './tools.js';
import { buildSystemPrompt } from './prompt-template.js';
import { ContextManager } from './context-manager.js';
import { SafetyGuard } from './safety.js';
import { useAgentStore } from '../stores/agent-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { useFileStore } from '../stores/file-store.js';
import type { AgentProvider, ThoughtEntry, ToolCallEntry } from '../types/agent.js';

function createId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a model instance from BYOK settings.
 */
function createModel(provider: AgentProvider, apiKey: string, model: string, baseUrl?: string) {
  switch (provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }
    case 'ollama': {
      const ollama = createOpenAI({
        baseURL: `${baseUrl || 'http://localhost:11434'}/v1`,
        apiKey: 'ollama', // Ollama doesn't need a real key
      });
      return ollama(model);
    }
  }
}

/**
 * Builds project context string from the current file tree.
 */
function getProjectContext(): string {
  const { rootName, tree } = useFileStore.getState();
  if (!rootName) return '';

  const mapTree = (nodes: typeof tree, depth = 0): string => {
    return nodes.map((n) => {
      const indent = '  '.repeat(depth);
      if (n.kind === 'directory') {
        return `${indent}📁 ${n.name}/\n${n.children ? mapTree(n.children, depth + 1) : ''}`;
      }
      return `${indent}📄 ${n.name}`;
    }).join('\n');
  };

  return `Project: ${rootName}\n\nFile Structure:\n${mapTree(tree)}`;
}

/**
 * Runs the autonomous agent loop with the given objective.
 */
export async function runAgentLoop(objective: string, abortSignal?: AbortSignal): Promise<void> {
  const store = useAgentStore.getState();
  const settings = useSettingsStore.getState();

  // Validate settings
  if (settings.provider !== 'ollama' && !settings.apiKey) {
    store.setError('No API key configured. Set your key in Agent Config.');
    store.setStatus('error');
    return;
  }

  // Initialize
  store.reset();
  store.setObjective(objective);
  store.setStatus('running');

  const model = createModel(settings.provider, settings.apiKey, settings.model, settings.baseUrl);
  const tools = createTools();
  const contextManager = new ContextManager();

  const safetyGuard = new SafetyGuard({
    commandBudget: settings.commandBudget,
    maxSteps: settings.maxSteps,
    onEvent: (event) => {
      const s = useAgentStore.getState();
      switch (event.type) {
        case 'command_budget_reached':
          s.setStatus('paused');
          s.addThought({
            id: createId(), timestamp: Date.now(), type: 'observation',
            content: `⚠️ Paused: ${event.consecutiveCount} consecutive commands reached. Awaiting user approval to continue.`,
          });
          break;
        case 'step_budget_warning':
          s.addThought({
            id: createId(), timestamp: Date.now(), type: 'observation',
            content: `⚠️ Step budget at 80% (${event.currentStep}/${event.maxSteps})`,
          });
          break;
        case 'step_budget_exceeded':
          s.setStatus('paused');
          s.addThought({
            id: createId(), timestamp: Date.now(), type: 'error',
            content: `🛑 Step budget exceeded (${event.currentStep}/${event.maxSteps}). Agent paused.`,
          });
          break;
      }
    },
  });

  // Build initial messages
  const projectContext = getProjectContext();
  const messages: ModelMessage[] = [
    { role: 'system', content: buildSystemPrompt(projectContext) },
    { role: 'user', content: objective },
  ];

  try {
    // Main agent loop
    while (true) {
      if (abortSignal?.aborted) {
        store.setStatus('idle');
        store.addThought({ id: createId(), timestamp: Date.now(), type: 'observation', content: 'Agent stopped by user.' });
        break;
      }

      if (safetyGuard.isPaused) {
        // Wait for resume — in a real impl, this would await a Promise
        break;
      }

      // Prune context if needed
      const prunedMessages = contextManager.prune(messages);

      const result = streamText({
        model,
        messages: prunedMessages,
        tools,
        abortSignal,
      });

      // Stream the response
      let currentText = '';
      for await (const chunk of result.stream) {
        if (abortSignal?.aborted) break;

        if (chunk.type === 'text-delta') {
          currentText += chunk.text;
        }

        if (chunk.type === 'tool-call') {
          // Check safety before executing
          const canProceed = safetyGuard.checkTool(chunk.toolName);
          const s = useAgentStore.getState();
          s.incrementStep();

          if (chunk.toolName === 'execute_command') {
            s.incrementConsecutiveCommands();
          } else {
            s.resetConsecutiveCommands();
          }

          const tcEntry: ToolCallEntry = {
            id: chunk.toolCallId,
            timestamp: Date.now(),
            toolName: chunk.toolName,
            args: chunk.args as Record<string, unknown>,
            status: canProceed ? 'running' : 'pending',
          };
          s.addToolCall(tcEntry);

          if (!canProceed) break;
        }
      }

      // Add reasoning as thought
      if (currentText.trim()) {
        const thoughtEntry: ThoughtEntry = {
          id: createId(),
          timestamp: Date.now(),
          content: currentText.trim(),
          type: 'reasoning',
        };
        useAgentStore.getState().addThought(thoughtEntry);
      }

      // Collect response messages and tool calls
      const responseMessages = await result.responseMessages;
      messages.push(...responseMessages);

      const finishReason = await result.finishReason;

      if (finishReason === 'tool-calls') {
        const toolCalls = await result.toolCalls;
        const toolResults = await result.toolResults;

        // Update tool call statuses
        const s = useAgentStore.getState();
        for (const tr of toolResults) {
          const start = s.toolCalls.find((tc) => tc.id === tr.toolCallId)?.timestamp ?? Date.now();
          s.updateToolCall(tr.toolCallId, {
            status: 'success',
            result: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result),
            duration: Date.now() - start,
          });
        }

        // Add tool result messages
        messages.push({
          role: 'tool',
          content: toolResults.map((tr) => ({
            type: 'tool-result' as const,
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            result: tr.result,
          })),
        });

      } else {
        // Agent finished — no more tool calls
        const s = useAgentStore.getState();
        s.setStatus('complete');
        s.addThought({
          id: createId(), timestamp: Date.now(), type: 'observation',
          content: '✅ Objective complete.',
        });
        break;
      }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const s = useAgentStore.getState();

    if (errMsg.includes('aborted') || errMsg.includes('abort')) {
      s.setStatus('idle');
      s.addThought({ id: createId(), timestamp: Date.now(), type: 'observation', content: 'Agent stopped.' });
    } else {
      s.setStatus('error');
      s.setError(errMsg);
      s.addThought({ id: createId(), timestamp: Date.now(), type: 'error', content: `Error: ${errMsg}` });
    }
  }
}
