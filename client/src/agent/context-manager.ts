/**
 * Context manager for sliding-window message context.
 * Prunes oldest messages to stay within token budget.
 */

import type { ModelMessage } from 'ai';

const AVG_CHARS_PER_TOKEN = 4;

export class ContextManager {
  private maxTokens: number;

  constructor(maxTokens: number = 100000) {
    this.maxTokens = maxTokens;
  }

  /**
   * Estimates token count for a message array.
   */
  estimateTokens(messages: ModelMessage[]): number {
    let chars = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        chars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if ('text' in part) chars += (part as { text: string }).text.length;
          else if ('output' in part) {
            const output = (part as { output: unknown }).output;
            chars += typeof output === 'string' ? output.length : JSON.stringify(output).length;
          }
        }
      }
    }
    return Math.ceil(chars / AVG_CHARS_PER_TOKEN);
  }

  /**
   * Prunes messages to fit within the token budget.
   * Preserves: system prompt (first message) and most recent N messages.
   */
  prune(messages: ModelMessage[]): ModelMessage[] {
    const estimated = this.estimateTokens(messages);

    if (estimated <= this.maxTokens) {
      return messages;
    }

    // Always keep the system message (index 0) and the latest messages
    const systemMsg = messages[0];
    const restMessages = messages.slice(1);

    // Remove oldest messages (pairs of user/assistant/tool) until under budget
    let pruned = [...restMessages];
    while (this.estimateTokens([systemMsg, ...pruned]) > this.maxTokens && pruned.length > 4) {
      // Remove in pairs (user + response) to maintain conversation coherence
      pruned = pruned.slice(2);
    }

    return [systemMsg, ...pruned];
  }

  /**
   * Returns current budget usage as a percentage.
   */
  getUsagePercent(messages: ModelMessage[]): number {
    const tokens = this.estimateTokens(messages);
    return Math.min(100, Math.round((tokens / this.maxTokens) * 100));
  }
}
