import { useRef } from 'react';
import { useAgentStore } from '../../stores/agent-store';
import { runAgentLoop } from '../../agent/agent-loop';
import { AgentHeader } from '../agent/AgentHeader';
import { ObjectiveBanner } from '../agent/ObjectiveBanner';
import { ToolCallStream } from '../agent/ToolCallStream';
import { AgentInput } from '../agent/AgentInput';
import type { AgentStatus } from '../../types/agent';

export default function AgentPanel() {
  const {
    status,
    objective,
    currentStep,
    maxSteps,
    consecutiveCommands,
    commandBudget,
    toolCalls,
    resumeHandler
  } = useAgentStore();

  const abortRef = useRef<AbortController | null>(null);

  const statusColors: Record<AgentStatus, string> = {
    idle: 'var(--color-text-dimmed)',
    running: 'var(--color-success)',
    paused: 'var(--color-warning)',
    error: 'var(--color-error)',
    complete: 'var(--color-accent-primary)',
  };

  const handleStartAgent = (submittedObjective: string) => {
    abortRef.current = new AbortController();
    runAgentLoop(submittedObjective, abortRef.current.signal);
  };

  const handleStopAgent = () => {
    abortRef.current?.abort();
    useAgentStore.getState().setStatus('idle');
  };

  // Find unique file paths edited from successful tool calls
  const editedFiles = Array.from(
    new Set(
      toolCalls
        .filter((tc) => tc.toolName === 'patch_file' && tc.status === 'success' && tc.args?.path)
        .map((tc) => tc.args.path as string)
    )
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      fontSize: '11px',
      backgroundColor: 'var(--color-bg-surface)'
    }}>
      <AgentHeader status={status} statusColors={statusColors} />

      <ObjectiveBanner
        objective={objective}
        currentStep={currentStep}
        maxSteps={maxSteps}
        consecutiveCommands={consecutiveCommands}
        commandBudget={commandBudget}
        editedFiles={editedFiles}
      />

      <ToolCallStream toolCalls={toolCalls} />

      <AgentInput
        status={status}
        consecutiveCommands={consecutiveCommands}
        resumeHandler={resumeHandler}
        onSubmitObjective={handleStartAgent}
        onStopAgent={handleStopAgent}
      />
    </div>
  );
}
