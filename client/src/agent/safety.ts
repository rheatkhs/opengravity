/**
 * Safety guardrails for the autonomous agent.
 * Implements step budget counter and command approval flow.
 */

export type SafetyEvent =
  | { type: 'command_budget_reached'; consecutiveCount: number }
  | { type: 'step_budget_warning'; currentStep: number; maxSteps: number }
  | { type: 'step_budget_exceeded'; currentStep: number; maxSteps: number };

export class SafetyGuard {
  private consecutiveCommands = 0;
  private commandBudget: number;
  private currentStep = 0;
  private maxSteps: number;
  private paused = false;
  private onEvent: (event: SafetyEvent) => void;

  constructor(options: {
    commandBudget?: number;
    maxSteps?: number;
    onEvent: (event: SafetyEvent) => void;
  }) {
    this.commandBudget = options.commandBudget ?? 5;
    this.maxSteps = options.maxSteps ?? 50;
    this.onEvent = options.onEvent;
  }

  /**
   * Called before a tool invocation. Returns false if execution should pause.
   */
  checkTool(toolName: string): boolean {
    this.currentStep++;

    // Check step budget
    if (this.currentStep >= this.maxSteps) {
      this.onEvent({
        type: 'step_budget_exceeded',
        currentStep: this.currentStep,
        maxSteps: this.maxSteps,
      });
      return false;
    }

    // Warn at 80% budget
    if (this.currentStep === Math.floor(this.maxSteps * 0.8)) {
      this.onEvent({
        type: 'step_budget_warning',
        currentStep: this.currentStep,
        maxSteps: this.maxSteps,
      });
    }

    // Track consecutive execute_command calls
    if (toolName === 'execute_command') {
      this.consecutiveCommands++;
      if (this.consecutiveCommands >= this.commandBudget) {
        this.paused = true;
        this.onEvent({
          type: 'command_budget_reached',
          consecutiveCount: this.consecutiveCommands,
        });
        return false;
      }
    } else {
      this.consecutiveCommands = 0;
    }

    return true;
  }

  /**
   * Resumes execution after user approval.
   */
  resume(): void {
    this.paused = false;
    this.consecutiveCommands = 0;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get step(): number {
    return this.currentStep;
  }

  reset(): void {
    this.consecutiveCommands = 0;
    this.currentStep = 0;
    this.paused = false;
  }
}
