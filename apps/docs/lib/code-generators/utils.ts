/**
 * Type guard to check if a value is a plain object (Record).
 * Validates at runtime that:
 * - The value is of type 'object'
 * - It's not null (since typeof null === 'object')
 * - It's not an array
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
