/**
 * Matches backend token estimation (AGENTS.md):
 * input = max(1, ceil(prompt.length / 4)), output = fixed constant.
 */
export function estimateInputTokens(prompt: string): number {
  if (prompt.length === 0) return 0;
  return Math.max(1, Math.ceil(prompt.length / 4));
}

export function getFixedOutputTokens(): number {
  const raw = process.env.NEXT_PUBLIC_FIXED_OUTPUT_TOKENS;
  const n = raw ? parseInt(raw, 10) : 100;
  return Number.isFinite(n) && n > 0 ? n : 100;
}

export function estimateTotalTokensForPrompt(prompt: string): number {
  if (prompt.trim().length === 0) return 0;
  return estimateInputTokens(prompt) + getFixedOutputTokens();
}
