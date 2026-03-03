import * as process from 'node:process';

/**
 * Whether the CLI is in interactive mode (TTY, no CI, no PACHCA_PROMPT_DISABLED).
 */
export function isInteractive(): boolean {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false;
  if (process.env.CI) return false;
  if (process.env.PACHCA_PROMPT_DISABLED) return false;
  return true;
}

/**
 * Whether color output should be used.
 */
export function useColor(): boolean {
  if (process.env.FORCE_COLOR) return true;
  if (process.env.NO_COLOR) return false;
  if (process.env.TERM === 'dumb') return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

/**
 * Default output format based on TTY.
 */
export function defaultOutputFormat(): string {
  return process.stdout.isTTY ? 'table' : 'json';
}

/**
 * Format file size for display.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Levenshtein distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[la][lb];
}
